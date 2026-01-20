import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold text-navy-800 mb-4">Terms of Service</h1>
        <p className="text-neutral-600 mb-8">Last Updated: November 7, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-neutral-700 mb-4">
              Welcome to GP Fileshare, operated by Grendel Press LLC ("Grendel Press," "we," "us," or "our"). By accessing or using our manuscript distribution platform (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
            </p>
            <p className="text-neutral-700 mb-4">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">2. Description of Service</h2>
            <p className="text-neutral-700 mb-4">
              GP Fileshare is a manuscript distribution platform that enables authors and publishers to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Upload and store manuscripts in PDF and EPUB formats</li>
              <li>Generate watermarked copies with reader information</li>
              <li>Create password-protected access for designated readers</li>
              <li>Track downloads and reader engagement</li>
              <li>Manage reader lists and distribution groups</li>
              <li>Organize books into series and collections</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Account Registration</h3>
            <p className="text-neutral-700 mb-4">
              To use the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Account Eligibility</h3>
            <p className="text-neutral-700 mb-4">
              You must be at least 18 years old to use the Service. By creating an account, you represent that you meet this age requirement.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Account Termination</h3>
            <p className="text-neutral-700 mb-4">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason, with or without notice. You may cancel your account at any time through your account settings or by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">4. Subscription and Payment</h2>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Subscription Plans</h3>
            <p className="text-neutral-700 mb-4">
              The Service is offered on a subscription basis at $4.99 per month. Some users may receive complimentary access through invitation codes provided by Grendel Press or partner organizations.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Free Trial</h3>
            <p className="text-neutral-700 mb-4">
              New users receive a 7-day free trial. Your subscription will begin automatically after the trial period unless you cancel before the trial ends.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Billing</h3>
            <p className="text-neutral-700 mb-4">
              By subscribing, you authorize us to charge your payment method:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Monthly subscription fees are billed in advance</li>
              <li>Billing occurs on the same day each month</li>
              <li>Payment processing is handled by Stripe</li>
              <li>You are responsible for keeping payment information current</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Cancellation and Refunds</h3>
            <p className="text-neutral-700 mb-4">
              You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period. We do not provide refunds for partial months or unused portions of your subscription, except as required by law.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Price Changes</h3>
            <p className="text-neutral-700 mb-4">
              We reserve the right to change subscription prices. We will provide at least 30 days' notice before any price increase takes effect. Your continued use of the Service after a price change constitutes acceptance of the new price.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">5. Content Rights and Responsibilities</h2>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Your Content</h3>
            <p className="text-neutral-700 mb-4">
              You retain all ownership rights to the content you upload to the Service ("Your Content"). By uploading content, you grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Store and process your manuscripts and related files</li>
              <li>Generate watermarked copies as you direct</li>
              <li>Display your content within the Service</li>
              <li>Make backup copies for operational purposes</li>
            </ul>
            <p className="text-neutral-700 mb-4">
              This license exists only to operate the Service and ends when you delete your content or account.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Content Restrictions</h3>
            <p className="text-neutral-700 mb-4">
              You agree not to upload content that:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Infringes intellectual property rights of others</li>
              <li>Contains malware, viruses, or harmful code</li>
              <li>Violates any applicable laws or regulations</li>
              <li>Contains child sexual abuse material</li>
              <li>Promotes illegal activities</li>
              <li>Violates rights of privacy or publicity</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Content Monitoring</h3>
            <p className="text-neutral-700 mb-4">
              We do not routinely monitor uploaded content, but we reserve the right to review content and remove material that violates these Terms. We may report illegal content to appropriate authorities.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Watermarking</h3>
            <p className="text-neutral-700 mb-4">
              Our watermarking feature embeds reader information into distributed copies for tracking and protection purposes. By using this feature, you represent that you have the right to distribute the content and that such distribution does not violate any agreements or laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">6. Acceptable Use</h2>
            <p className="text-neutral-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove or modify any watermarks or proprietary notices</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service to distribute spam or unsolicited messages</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Collect or harvest information about other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">7. Intellectual Property</h2>
            <p className="text-neutral-700 mb-4">
              The Service, including its design, features, graphics, and code, is owned by Grendel Press and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our express written permission.
            </p>
            <p className="text-neutral-700 mb-4">
              "GP Fileshare," "Grendel Press," and associated logos are trademarks of Grendel Press LLC. You may not use these marks without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">8. Privacy</h2>
            <p className="text-neutral-700 mb-4">
              Your use of the Service is subject to our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">9. Disclaimers and Limitations of Liability</h2>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Service "As Is"</h3>
            <p className="text-neutral-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">No Liability for Content</h3>
            <p className="text-neutral-700 mb-4">
              We are not responsible for user-generated content. You use content at your own risk. We do not endorse or guarantee the accuracy, quality, or legality of user content.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Limitation of Liability</h3>
            <p className="text-neutral-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, GRENDEL PRESS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-neutral-700 mb-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Data Backup</h3>
            <p className="text-neutral-700 mb-4">
              While we implement backup procedures, you are solely responsible for maintaining your own backup copies of your content. We are not responsible for any loss or corruption of your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">10. Indemnification</h2>
            <p className="text-neutral-700 mb-4">
              You agree to indemnify, defend, and hold harmless Grendel Press, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or related to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Your use of the Service</li>
              <li>Your content</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">11. Copyright Infringement</h2>
            <p className="text-neutral-700 mb-4">
              We respect intellectual property rights. If you believe content on our Service infringes your copyright, please contact us at info@grendelpress.com with:
            </p>
            <ul className="list-disc pl-6 mb-4 text-neutral-700 space-y-2">
              <li>Identification of the copyrighted work</li>
              <li>Identification of the infringing material</li>
              <li>Your contact information</li>
              <li>A statement of good faith belief that the use is unauthorized</li>
              <li>A statement that the information is accurate and you are authorized to act</li>
              <li>Your physical or electronic signature</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">12. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Informal Resolution</h3>
            <p className="text-neutral-700 mb-4">
              If you have a dispute with us, please contact us first at info@grendelpress.com to attempt to resolve the issue informally.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Governing Law</h3>
            <p className="text-neutral-700 mb-4">
              These Terms are governed by the laws of the state where Grendel Press LLC is registered, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Arbitration</h3>
            <p className="text-neutral-700 mb-4">
              Any disputes that cannot be resolved informally shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to a jury trial and to participate in class actions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">13. General Provisions</h2>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Entire Agreement</h3>
            <p className="text-neutral-700 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Grendel Press regarding the Service.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Severability</h3>
            <p className="text-neutral-700 mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Waiver</h3>
            <p className="text-neutral-700 mb-4">
              Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Assignment</h3>
            <p className="text-neutral-700 mb-4">
              You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-navy-700 mb-3">Survival</h3>
            <p className="text-neutral-700 mb-4">
              Provisions that by their nature should survive termination (including ownership, disclaimers, indemnification, and limitations of liability) will survive termination of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-800 mb-4">14. Contact Information</h2>
            <p className="text-neutral-700 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-neutral-50 p-6 rounded-lg">
              <p className="text-neutral-700 mb-2"><strong>Grendel Press LLC</strong></p>
              <p className="text-neutral-700 mb-2">Email: info@grendelpress.com</p>
              <p className="text-neutral-700">Website: grendelpress.com</p>
            </div>
          </section>

          <section className="mb-8">
            <p className="text-neutral-700 mb-4">
              By using GP Fileshare, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
