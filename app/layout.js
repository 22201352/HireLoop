import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'HireLoop',
  description: 'AI-powered recruitment platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}