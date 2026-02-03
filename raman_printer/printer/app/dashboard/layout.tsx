import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DashboardNav from '@/components/DashboardNav';
import Script from 'next/script';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-200">
        <DashboardNav user={session.user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {children}
        </main>
      </div>
    </>
  );
}
