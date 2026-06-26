import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">{title}</h2>
    <div className="space-y-3 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</div>
  </section>
);

export default function TermsOfService() {
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
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Terms of Service</h1>
            <p className="text-sm text-gray-400">Last updated: June 25, 2026</p>
          </div>

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using SEO Gen AI ("the Service"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, do not use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes
              acceptance of the revised Terms. We will notify registered users of material changes by email.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              SEO Gen AI is a software-as-a-service (SaaS) platform that provides AI-powered SEO article generation,
              content optimization, keyword research, and WordPress publishing tools.
            </p>
            <p>The Service relies on third-party AI providers (OpenAI, OpenRouter, and others). Service availability
              and output quality may be affected by the availability and performance of these providers.</p>
          </Section>

          <Section title="3. Account Registration">
            <p>You must provide accurate and complete information when creating an account. You are responsible for
              maintaining the security of your account credentials and for all activities that occur under your account.</p>
            <p>You must be at least 16 years of age to use this Service. By registering, you represent and warrant
              that you meet this age requirement.</p>
            <p>One person or legal entity may not maintain more than one free account. Bulk account creation is prohibited.</p>
          </Section>

          <Section title="4. Credits and Payment">
            <p>The Service operates on a credit-based system. Credits are consumed when generating AI articles.
              Unused credits do not expire but are non-refundable except as required by applicable law.</p>
            <p>Payments are processed by Stripe, Inc. By making a purchase, you agree to Stripe's terms of service.
              We do not store your payment card information.</p>
            <p>Subscription plans auto-renew monthly. You may cancel at any time from your account settings. Cancellation
              takes effect at the end of the current billing period. No partial refunds are issued for unused subscription time.</p>
            <p>We reserve the right to modify pricing at any time with 30 days' notice to existing subscribers.</p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree NOT to use the Service to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Generate content that is illegal, harmful, defamatory, or violates third-party rights</li>
              <li>Create spam, misleading content, or engage in black-hat SEO practices</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the API</li>
              <li>Share your account credentials with others</li>
              <li>Use automated scripts or bots to interact with the Service beyond intended use</li>
              <li>Infringe upon intellectual property rights of third parties</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these rules without prior notice.</p>
          </Section>

          <Section title="6. AI-Generated Content">
            <p>Content generated by the Service is produced by AI models and may contain inaccuracies, errors, or
              outdated information. You are solely responsible for reviewing, editing, and verifying any AI-generated
              content before publishing or relying upon it.</p>
            <p>You retain ownership of the articles and content you generate using the Service. By using the Service,
              you grant us a limited, non-exclusive license to process and store your content for the purpose of
              providing the Service.</p>
            <p>We make no representations about the originality, accuracy, or SEO effectiveness of generated content.</p>
          </Section>

          <Section title="7. Your API Keys">
            <p>If you provide your own OpenAI or third-party API key, you are responsible for all usage charges
              incurred on that key. Your API key is encrypted at rest using AES-256 encryption.</p>
            <p>We will never use your personal API key for any purpose other than processing your own content generation
              requests within the Service.</p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>The SEO Gen AI platform, its design, code, and branding are the exclusive property of SEO Gen AI and
              protected by applicable intellectual property laws. This license grants you a limited, non-transferable
              right to use the Service for your own business purposes.</p>
            <p>You may not copy, redistribute, resell, or create derivative works of the platform software without
              explicit written permission.</p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or
              implied, including but not limited to merchantability, fitness for a particular purpose, or
              non-infringement.</p>
            <p>We do not warrant that the Service will be uninterrupted, error-free, or that results will meet your
              specific requirements.</p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>To the maximum extent permitted by law, SEO Gen AI shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including loss of profits, data, or business opportunities,
              arising from your use of or inability to use the Service.</p>
            <p>Our total liability for any claim arising from use of the Service shall not exceed the amount you paid
              us in the three months preceding the claim.</p>
          </Section>

          <Section title="11. Termination">
            <p>You may terminate your account at any time by contacting support or using the account deletion feature
              in your settings (GDPR right to erasure). Upon termination, your data will be permanently deleted.</p>
            <p>We may terminate or suspend your account immediately, without prior notice, for violation of these Terms.</p>
          </Section>

          <Section title="12. Governing Law">
            <p>These Terms shall be governed by the laws applicable in the jurisdiction of the service operator,
              without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration
              or in the competent courts of that jurisdiction.</p>
          </Section>

          <Section title="13. Contact">
            <p>For questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@seogenai.com" className="text-primary-600 hover:underline">legal@seogenai.com</a>.
            </p>
          </Section>
        </div>
      </main>

      <footer className="text-center py-8 text-sm text-gray-400">
        <span>© 2026 SEO Gen AI. </span>
        <Link to="/privacy" className="hover:text-gray-600 underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
