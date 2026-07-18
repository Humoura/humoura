import Link from "next/link";

export function PrivacyContent() {
  return (
    <div className="policyContent">
      <h1>🔐 Privacy Policy</h1>
      <p>
        <strong>Effective Date:</strong> May 12, 2026
      </p>
      <p>
        Welcome to Humoura (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
        Humoura is a social platform designed to share funny and uplifting videos
        and content.
      </p>
      <h2>Information We Collect</h2>
      <ul>
        <li>Account information such as username, email address, and password</li>
        <li>Content you post, including videos, comments, and messages</li>
        <li>Usage data such as pages visited and interactions</li>
        <li>Device and browser information</li>
        <li>Cookies and similar technologies</li>
      </ul>
      <h2>How We Use Your Information</h2>
      <ul>
        <li>Create and manage your account</li>
        <li>Provide and improve the platform</li>
        <li>Display your content to other users</li>
        <li>Communicate with you</li>
        <li>Prevent abuse and maintain security</li>
      </ul>
      <h2>Contact</h2>
      <p>If you have questions, contact us at: support@humoura.com</p>
    </div>
  );
}

export function TermsContent() {
  return (
    <div className="policyContent">
      <h1>⚖️ Terms of Service</h1>
      <p>
        <strong>Effective Date:</strong> May 12, 2026
      </p>
      <p>
        Welcome to Humoura. By accessing or using Humoura, you agree to these
        Terms of Service.
      </p>
      <h2>Eligibility</h2>
      <p>You must be at least 13 years old to use Humoura.</p>
      <h2>User Content</h2>
      <p>
        You retain ownership of the content you post, but you grant Humoura a
        worldwide, non-exclusive license to host and display your content.
      </p>
      <h2>Prohibited Content</h2>
      <p>
        Users may not post content that violates laws, infringes copyrights,
        contains harassment, or promotes illegal activity.
      </p>
      <h2>Contact</h2>
      <p>support@humoura.com</p>
    </div>
  );
}

export function GuidelinesContent() {
  return (
    <div className="policyContent">
      <h1>👥 Community Guidelines</h1>
      <p>
        Humoura exists to spread laughter, positivity, and meaningful connection.
      </p>
      <h2>Be Respectful</h2>
      <p>Treat others with kindness and respect.</p>
      <h2>Keep It Fun and Positive</h2>
      <p>
        Content should align with Humoura&apos;s goal of providing uplifting and
        entertaining experiences.
      </p>
      <h2>No Harmful Content</h2>
      <p>
        Do not post harassment, hate speech, graphic violence, sexually explicit
        material, illegal content, or spam.
      </p>
      <h2>Our Mission</h2>
      <p>
        Humoura was created to help people smile, relax, and enjoy a more
        positive online experience.
      </p>
    </div>
  );
}

export function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="loginContainer">
      <div
        className="policyPage"
        style={{
          width: "90%",
          maxWidth: "800px",
          height: "auto",
          maxHeight: "90vh",
          padding: "40px",
          margin: "0 auto",
        }}
      >
        <Link href="/login" className="backBtn">
          ← Back
        </Link>
        {children}
      </div>
    </div>
  );
}
