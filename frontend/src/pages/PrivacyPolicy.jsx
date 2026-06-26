import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Shield } from 'lucide-react';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">{title}</h2>
    <div className="space-y-3 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</div>
  </section>
);

const DataRow = ({ category, purpose, retention }) => (
  <tr className="border-b border-gray-100 dark:border-gray-800">
    <td className="py-3 pr-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{category}</td>
    <td className="py-3 pr-4 text-sm text-gray-600 dark:text-gray-400">{purpose}</td>
    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{retention}</td>
  </tr>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2">
            <div className="bg-primary-600 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900 dark:text-white">SEO Gen AI</span>
          </Link>
          <Link to="/welcome" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 sm:p-12">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-xl">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Privacy Policy</h1>
            </div>
            <p className="text-sm text-gray-400">Last updated: June 25, 2026 — GDPR compliant</p>
          </div>

          <Section title="1. Who We Are">
            <p>
              SEO Gen AI ("we", "us", "our") operates the SEO Gen AI SaaS platform. This Privacy Policy explains how
              we collect, use, store, and protect your personal data in compliance with the General Data Protection
              Regulation (GDPR) and other applicable privacy laws.
            </p>
            <p>
              Data Controller contact:{' '}
              <a href="mailto:privacy@seogenai.com" className="text-primary-600 hover:underline">privacy@seogenai.com</a>
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect only the minimum data necessary to provide the Service:</p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-4 text-xs font-black text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="pb-2 pr-4 text-xs font-black text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="pb-2 text-xs font-black text-gray-500 uppercase tracking-wider">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <DataRow category="Account data (name, email)" purpose="Authentication, account management" retention="Until account deletion" />
                  <DataRow category="Password (hashed)" purpose="Authentication" retention="Until account deletion" />
                  <DataRow category="Generated articles" purpose="Service delivery, history" retention="Until manually deleted or account deletion" />
                  <DataRow category="API keys (AES-256 encrypted)" purpose="AI model access" retention="Until user removes or account deletion" />
                  <DataRow category="Payment data" purpose="Billing (processed by Stripe)" retention="Stripe retains per their policy" />
                  <DataRow category="Usage logs" purpose="Security, debugging" retention="90 days" />
                  <DataRow category="Cover images" purpose="Article enrichment (stored on AWS S3)" retention="Until article/account deletion" />
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="3. Legal Basis for Processing (GDPR)">
            <p>We process your personal data on the following legal bases:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-gray-700 dark:text-gray-300">Contract performance:</strong> Account data and generated content — necessary to provide the Service.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Legitimate interests:</strong> Security logs, fraud prevention, service improvement.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Legal obligation:</strong> Retaining transaction records for tax compliance.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Consent:</strong> Optional cookies and analytics (where applicable).</li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Data">
            <p>We use your data exclusively to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Provide and improve the Service</li>
              <li>Authenticate you and secure your account</li>
              <li>Process payments and manage your subscription</li>
              <li>Send transactional emails (password resets, invoices)</li>
              <li>Detect and prevent abuse or fraudulent activity</li>
            </ul>
            <p>We <strong className="text-gray-700 dark:text-gray-300">do not</strong> sell, rent, or trade your personal data to third parties.
              We do not use your data to train AI models.</p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>We share limited data with the following processors to operate the Service:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-gray-700 dark:text-gray-300">OpenAI / OpenRouter:</strong> Your article keywords and prompts are sent to generate content. No personal identifiers are included in prompts.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Stripe:</strong> Handles payment processing. We never see your full card number.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Amazon Web Services (S3):</strong> Stores cover images. Images are served via signed URLs with expiry.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Resend:</strong> Sends transactional emails (password resets).</li>
            </ul>
            <p>All processors are contractually bound to protect your data and comply with GDPR.</p>
          </Section>

          <Section title="6. Data Security">
            <p>We implement technical and organizational measures to protect your data:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Passwords are hashed using bcrypt (cost factor 10)</li>
              <li>API keys and WordPress credentials are encrypted at rest with AES-256</li>
              <li>All traffic is encrypted in transit via HTTPS/TLS</li>
              <li>JWT authentication tokens expire after 30 days</li>
              <li>Rate limiting protects against brute-force attacks</li>
              <li>HTTP security headers enforced via Helmet.js</li>
            </ul>
          </Section>

          <Section title="7. Your GDPR Rights">
            <p>Under GDPR, you have the following rights:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-gray-700 dark:text-gray-300">Right of access:</strong> Request a copy of your personal data.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Right to rectification:</strong> Correct inaccurate data via your account settings.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Right to erasure ("right to be forgotten"):</strong> Delete your account and all data permanently via <Link to="/settings" className="text-primary-600 hover:underline">Settings → Delete Account</Link>. This also removes all articles and images from our storage.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Right to data portability:</strong> Export your articles in HTML or Markdown format.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Right to object:</strong> Object to processing based on legitimate interests.</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Right to restrict processing:</strong> Request that we limit how we use your data.</li>
            </ul>
            <p>To exercise your rights, contact{' '}
              <a href="mailto:privacy@seogenai.com" className="text-primary-600 hover:underline">privacy@seogenai.com</a>.
              We will respond within 30 days as required by GDPR.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>We use only essential cookies required for authentication (session tokens stored in <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">localStorage</code>).
              We do not use tracking cookies or advertising cookies.</p>
            <p>If you choose to accept optional analytics cookies via our cookie banner, you may withdraw consent at any time by clearing your browser storage.</p>
          </Section>

          <Section title="9. Data Transfers">
            <p>Your data may be processed on servers located in the United States (AWS, OpenAI, Stripe).
              These transfers are covered by Standard Contractual Clauses (SCCs) approved by the European Commission,
              ensuring adequate protection as required by GDPR Article 46.</p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>The Service is not directed to individuals under 16 years of age. We do not knowingly collect
              personal data from children. If you believe we have collected data from a child, please contact us
              immediately.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes by email
              and/or by posting a notice on the Service. The "last updated" date at the top of this page indicates
              when the policy was last revised.</p>
          </Section>

          <Section title="12. Contact & Complaints">
            <p>For privacy-related questions or to exercise your rights:</p>
            <p>
              Email: <a href="mailto:privacy@seogenai.com" className="text-primary-600 hover:underline">privacy@seogenai.com</a>
            </p>
            <p>
              You also have the right to lodge a complaint with your local data protection authority (e.g., CNIL in France,
              ICO in the UK, or your national supervisory authority).
            </p>
          </Section>
        </div>
      </main>

      <footer className="text-center py-8 text-sm text-gray-400">
        <span>© 2026 SEO Gen AI. </span>
        <Link to="/terms" className="hover:text-gray-600 underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
