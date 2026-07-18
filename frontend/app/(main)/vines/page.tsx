"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Vine } from "@/lib/types";

export default function VinesPage() {
  const { token, userId } = useAuth();
  const router = useRouter();
  const [vines, setVines] = useState<Vine[]>([]);
  const [currentVineIndex, setCurrentVineIndex] = useState(0);
  const [pausedVineIndex, setPausedVineIndex] = useState<number | null>(null);
  const [showVineUpload, setShowVineUpload] = useState(false);
  const [vineVideoFile, setVineVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVines = useCallback(async () => {
    try {
      const res = await api.get("/api/vines", {
        headers: authHeaders(token),
      });
      setVines(res.data);
      setCurrentVineIndex(0);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    fetchVines();
  }, [fetchVines]);

  useEffect(() => {
    if (vines.length === 0 || showVineUpload) return;
    const container = document.getElementById("vinesReelContainer");
    if (!container) return;

    let lastWheelTime = 0;
    const wheelCooldown = 700;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime < wheelCooldown) {
        e.preventDefault();
        return;
      }
      const direction = e.deltaY > 0 ? 1 : -1;
      let nextIndex = currentVineIndex + direction;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= vines.length) nextIndex = vines.length - 1;
      if (nextIndex !== currentVineIndex) {
        setCurrentVineIndex(nextIndex);
        lastWheelTime = now;
        e.preventDefault();
        setTimeout(() => {
          const reels = container.querySelectorAll(".vineReel");
          if (reels[nextIndex]) {
            reels[nextIndex].scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 50);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentVineIndex((prev) => {
          const newIndex = Math.min(prev + 1, vines.length - 1);
          setTimeout(() => {
            const reels = container.querySelectorAll(".vineReel");
            if (reels[newIndex]) {
              reels[newIndex].scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 50);
          return newIndex;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentVineIndex((prev) => {
          const newIndex = Math.max(prev - 1, 0);
          setTimeout(() => {
            const reels = container.querySelectorAll(".vineReel");
            if (reels[newIndex]) {
              reels[newIndex].scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 50);
          return newIndex;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [vines, currentVineIndex, showVineUpload]);

  const createVine = async () => {
    if (!vineVideoFile) {
      alert("Please select a video file");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("video", vineVideoFile);
      await api.post("/api/vines/create", formData, {
        headers: authHeaders(token),
      });
      setVineVideoFile(null);
      setShowVineUpload(false);
      alert("Vine uploaded successfully! 🎉");
      await fetchVines();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Vine upload failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const likeVine = async (vineId: string) => {
    try {
      await api.put(
        `/api/vines/like/${vineId}`,
        {},
        { headers: authHeaders(token) }
      );
      await fetchVines();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Like failed";
      alert(message);
    }
  };

  const toggleVinePause = (index: number) => {
    const video = document.querySelector(
      `.vineReel[data-index="${index}"] video`
    ) as HTMLVideoElement | null;
    if (video) {
      if (video.paused) {
        video.play();
        setPausedVineIndex(null);
      } else {
        video.pause();
        setPausedVineIndex(index);
      }
    }
  };

  const viewProfile = (id?: string) => {
    if (!id) return;
    if (id === userId) router.push("/profile");
    else router.push(`/users/${id}`);
  };

  return (
    <div className="vinesSection">
      {showVineUpload && (
        <div className="vineUploadBox">
          <h3>📹 Upload Your Vine</h3>
          <div className="vineUploadForm">
            <label htmlFor="vineVideoInput" className="uploadBtn">
              Choose Video
            </label>
            <input
              id="vineVideoInput"
              type="file"
              accept="video/*"
              onChange={(e) => setVineVideoFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {vineVideoFile && (
              <span className="fileSelected">✓ {vineVideoFile.name}</span>
            )}
            <button
              onClick={createVine}
              disabled={loading}
              className="primaryBtn"
            >
              {loading ? "Uploading..." : "Post Vine 🚀"}
            </button>
            <button
              onClick={() => setShowVineUpload(false)}
              className="secondaryBtn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {vines.length === 0 && !showVineUpload ? (
        <div className="emptyVinesState">
          <p>🎬 No vines yet. Be the first to create one! 🎉</p>
          <button
            className="vineUploadBtn"
            onClick={() => setShowVineUpload(true)}
            title="Upload a new vine"
          >
            ➕
          </button>
        </div>
      ) : vines.length > 0 && !showVineUpload ? (
        <div className="vinesReelContainer" id="vinesReelContainer">
          {vines.map((vine, index) => (
            <div
              key={vine._id}
              className="vineReel"
              data-index={index}
              onClick={() => toggleVinePause(index)}
            >
              <video
                className="vineReelVideo"
                autoPlay={index === currentVineIndex}
                loop
                playsInline
                muted={index !== currentVineIndex}
              >
                <source src={mediaUrl(vine.videoUrl)} type="video/mp4" />
              </video>
              {pausedVineIndex === index && (
                <div className="vinePauseOverlay">
                  <div className="pauseIcon">⏸️</div>
                </div>
              )}
              <div className="vineReelOverlay">
                <div className="vineReelCreatorInfo">
                  <div
                    className="vineReelAvatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewProfile(vine.authorId?._id);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {vine.authorId?.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(vine.authorId.profilePicture)}
                        alt={vine.authorId?.username}
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div className="vineReelDetails">
                    <p className="vineReelName">
                      {vine.authorId?.username || "Unknown"}
                    </p>
                    <p className="vineReelDesc">
                      {vine.description || "Check out this vine!"}
                    </p>
                  </div>
                </div>
                <div className="vineReelSideActions">
                  <div className="sideActionItem">
                    <button
                      className="vineActionIcon"
                      onClick={(e) => {
                        e.stopPropagation();
                        likeVine(vine._id);
                      }}
                      title="Like"
                    >
                      ❤️
                    </button>
                    <span className="actionCount">
                      {vine.likes?.length || 0}
                    </span>
                  </div>
                  <div className="sideActionItem">
                    <button
                      className="vineActionIcon"
                      onClick={(e) => e.stopPropagation()}
                      title="Comment"
                    >
                      💬
                    </button>
                    <span className="actionCount">
                      {vine.comments?.length || 0}
                    </span>
                  </div>
                  <div className="sideActionItem">
                    <button
                      className="vineActionIcon"
                      onClick={(e) => e.stopPropagation()}
                      title="Share"
                    >
                      📤
                    </button>
                  </div>
                  <div className="sideActionItem">
                    <button
                      className="vineActionIcon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVineUpload(true);
                      }}
                      title="Upload"
                    >
                      ➕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
