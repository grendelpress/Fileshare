import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <div className="flex items-center gap-2">
              <Check className="w-6 h-6 text-navy-700" />
              <span className="text-xl font-bold text-navy-800 font-sans">GP Fileshare</span>
            </div>
            <p className="text-xs text-neutral-600 ml-8">Secure Story Distribution</p>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-navy-800 mb-4">Privacy Policy</h1>
        <p className="text-neutral-600 mb-8">Last Updated: November 7, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">1. Introduction</h2>
            <p className="text-neutral-700 mb-4">
              GP Fileshare, operated by Grendel Press LLC ("we," "us," or "our"), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our manuscript distribution platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Account Information</h3>
            <p className="text-neutral-700 mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Email address</li>
              <li>Name (if provided)</li>
              <li>Password (encrypted)</li>
              <li>Author code (if applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Content You Upload</h3>
            <p className="text-neutral-700 mb-4">
              We store the manuscripts, books, and related files you upload to our platform, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Book titles, descriptions, and metadata</li>
              <li>PDF and EPUB files</li>
              <li>Cover images</li>
              <li>Series and collection information</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Reader Information</h3>
            <p className="text-neutral-700 mb-4">
              When you add readers or generate access passwords, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Reader names and email addresses</li>
              <li>Reader types and categories</li>
              <li>Distribution notes</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Usage Data</h3>
            <p className="text-neutral-700 mb-4">
              We automatically collect certain information about your interactions with our platform:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Download timestamps and activity</li>
              <li>IP addresses</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited and actions taken</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Payment Information</h3>
            <p className="text-neutral-700 mb-4">
              Payment processing is handled by Stripe. We do not store your credit card information. We receive:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Subscription status</li>
              <li>Billing history</li>
              <li>Payment method type (e.g., "Visa ending in 4242")</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">3. How We Use Your Information</h2>
            <p className="text-neutral-700 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your subscription and payments</li>
              <li>Generate watermarked copies of manuscripts with reader information</li>
              <li>Track downloads and provide analytics</li>
              <li>Communicate with you about your account and our services</li>
              <li>Respond to your questions and provide customer support</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-neutral-700 mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">With Your Consent</h3>
            <p className="text-neutral-700 mb-4">
              We share information with your explicit consent, such as when you generate access passwords for readers.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Service Providers</h3>
            <p className="text-neutral-700 mb-4">
              We work with third-party service providers who help us operate our platform:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Supabase (database and authentication)</li>
              <li>Stripe (payment processing)</li>
              <li>Cloud hosting providers</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Legal Requirements</h3>
            <p className="text-neutral-700 mb-4">
              We may disclose information if required by law, court order, or governmental request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Business Transfers</h3>
            <p className="text-neutral-700 mb-4">
              If Grendel Press is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">5. Data Security</h2>
            <p className="text-neutral-700 mb-4">
              We implement appropriate technical and organizational measures to protect your information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication and password hashing</li>
              <li>Row-level security policies in our database</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="text-neutral-700 mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">6. Data Retention</h2>
            <p className="text-neutral-700 mb-4">
              We retain your information for as long as your account is active or as needed to provide services. We will retain and use your information as necessary to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Maintain your account and provide services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className="text-neutral-700 mb-4">
              When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">7. Your Rights and Choices</h2>
            <p className="text-neutral-700 mb-4">You have the following rights regarding your information:</p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Access and Portability</h3>
            <p className="text-neutral-700 mb-4">
              You can access and download your data at any time through your account dashboard.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Correction</h3>
            <p className="text-neutral-700 mb-4">
              You can update your account information and content through your account settings.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Deletion</h3>
            <p className="text-neutral-700 mb-4">
              You can delete your account at any time. Contact us at info@grendelpress.com to request account deletion.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Marketing Communications</h3>
            <p className="text-neutral-700 mb-4">
              You can opt out of promotional emails by following the unsubscribe link in any marketing email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">8. Cookies and Tracking</h2>
            <p className="text-neutral-700 mb-4">
              We use essential cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze how our platform is used</li>
              <li>Improve security and prevent fraud</li>
            </ul>
            <p className="text-neutral-700 mb-4">
              You can control cookies through your browser settings, but disabling cookies may affect platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">9. Children's Privacy</h2>
            <p className="text-neutral-700 mb-4">
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">10. International Data Transfers</h2>
            <p className="text-neutral-700 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-neutral-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services after changes become effective constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">12. Contact Us</h2>
            <p className="text-neutral-700 mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-neutral-50 p-6 rounded-lg">
              <p className="text-neutral-700 mb-2"><strong>Grendel Press LLC</strong></p>
              <p className="text-neutral-700 mb-2">Email: info@grendelpress.com</p>
              <p className="text-neutral-700">Website: grendelpress.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
