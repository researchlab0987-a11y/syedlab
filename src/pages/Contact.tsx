import React from "react";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import ContactForm from "../components/ContactForm";
import { useSiteContent } from "../firebase/hooks";

const Contact: React.FC = () => {
  const { content, loading } = useSiteContent();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--color-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 text-center px-4"
        style={{ background: "var(--color-primary)" }}
      >
        {content["contact.bannerUrl"] && (
          <img
            src={content["contact.bannerUrl"]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.45)" }}
          />
        )}
        <div className="relative z-10">
          <h1
            className="font-black text-white mb-4"
            style={{
              fontSize: "clamp(2rem,4vw,3rem)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {content["contact.pageTitle"] ?? "Contact Us"}
          </h1>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {content["contact.pageSubtitle"] ?? "We'd love to hear from you."}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Contact Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2
            className="font-black text-xl"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Get In Touch
          </h2>

          {[
            {
              icon: "location" as AppIconName,
              label: "Address",
              value: content["contact.address"],
            },
            {
              icon: "contact" as AppIconName,
              label: "Email",
              value: content["contact.email"],
              href: content["contact.email"]
                ? `mailto:${content["contact.email"]}`
                : undefined,
            },
            {
              icon: "phone" as AppIconName,
              label: "Phone",
              value: content["contact.phone"],
              href: content["contact.phone"]
                ? `tel:${content["contact.phone"]}`
                : undefined,
            },
          ]
            .filter((item) => item.value)
            .map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "var(--color-primary)", fontSize: 18 }}
                >
                  <AppIcon name={item.icon} size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium no-underline hover:underline"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-700">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

          {/* Map embed */}
          {content["contact.mapEmbed"] && (
            <div
              className="rounded-xl overflow-hidden border mt-2"
              style={{ borderColor: "#e5e7eb" }}
            >
              <iframe
                src={content["contact.mapEmbed"]}
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Lab location map"
              />
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-3">
          <div
            className="bg-white rounded-2xl p-8 shadow-md border"
            style={{ borderColor: "#e5e7eb" }}
          >
            <h2
              className="font-black text-xl mb-6"
              style={{
                color: "var(--color-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {content["contact.formTitle"] ?? "Send a Message"}
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
