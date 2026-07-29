import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Smiling Pearl Dental Clinic",
  description: "Dental Clinic Management System"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
      </body>
    </html>
  );
}
