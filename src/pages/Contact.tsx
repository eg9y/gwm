import { Suspense } from "react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Remove Navbar since it's already in App component */}
      {/* <Navbar /> */}

      <main className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl font-medium text-primary mb-6">
            Kontak GWM Jakarta
          </h1>
          <p className="text-base text-secondary max-w-3xl mb-10 leading-relaxed">
            GWM, merek otomotif global yang inovatif, resmi hadir di Jakarta
            dengan membawa semangat baru dalam industri otomotif Indonesia.
            Dengan desain yang modern, performa tangguh, dan teknologi terkini,
            GWM siap memenuhi kebutuhan konsumen Indonesia. Dealer Resmi GWM
            Jakarta hadir untuk memberikan pengalaman berkendara yang tak
            terlupakan dan menjadi pilihan utama bagi para pecinta otomotif.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 md:p-8 rounded-lg shadow-sm">
              <h2 className="text-xl font-medium text-primary mb-6">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-primary mb-2">
                    Location
                  </h3>
                  <p className="text-secondary">
                    GWM Jakarta – Indonesia
                    <br />
                    Agora Mall Thamrin
                    <br />
                    Jl. M.H. Thamrin No.10, Kb. Melati, Tanah Abang, Jakarta
                    Pusat, DKI Jakarta 10230
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-primary mb-2">
                    Phone
                  </h3>
                  <a
                    href="tel:+6287774377422"
                    className="text-secondary hover:text-primary transition-colors"
                  >
                    0877 7437 7422 (Call/WA)
                  </a>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-primary mb-2">
                    Email
                  </h3>
                  <a
                    href="mailto:ramarkan.pratama@inchcape.co.id"
                    className="text-secondary hover:text-primary transition-colors"
                  >
                    ramarkan.pratama@inchcape.co.id
                  </a>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-primary mb-2">
                    Open Hours
                  </h3>
                  <ul className="text-secondary space-y-1">
                    <li>Monday : 9am – 9pm</li>
                    <li>Tuesday : 9am – 9pm</li>
                    <li>Wednesday : 9am – 9pm</li>
                    <li>Thursday : 9am – 9pm</li>
                    <li>Friday : 9am – 9pm</li>
                    <li>Saturday : 9am – 9pm</li>
                    <li>Sunday : 9am – 9pm</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="h-[400px] md:h-auto rounded-lg overflow-hidden shadow-sm">
              <Suspense
                fallback={
                  <div className="w-full h-full bg-gray-100 animate-pulse" />
                }
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.654660146815!2d106.82031827568823!3d-6.1917807936267395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d48d1e1ad7%3A0x7a5a18978e5b8397!2sAgora%20Mall%20Thamrin!5e0!3m2!1sen!2sid!4v1709871560288!5m2!1sen!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="GWM Jakarta Location"
                  className="w-full h-full min-h-[400px]"
                />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-medium text-primary mb-6">
            Send Us a Message
          </h2>
          <div className="bg-gray-50 p-6 md:p-8 rounded-lg shadow-sm">
            <form className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-primary"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-primary"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Your email address"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-primary"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Message subject"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-primary"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Your message"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Remove WhatsApp button and Footer since they're already in App component */}
      {/* <WhatsAppButton /> */}
      {/* <Footer /> */}
    </div>
  );
};

export default Contact;
