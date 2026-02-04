import Link from 'next/link';
import { PlusCircle, History, AlertCircle, User, Phone } from 'lucide-react';
import { auth } from '@/auth';
import { getSettings } from '@/app/actions/settings';

export default async function DashboardPage() {
  const session = await auth();
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Welcome, {session?.user?.name}!
      </h1>

      {/* Service Availability Warning */}
      {!settings.isServiceAvailable && (
        <div className="mb-6 bg-amber-400 dark:bg-amber-700 border-2 border-amber-600 dark:border-amber-600 rounded-lg p-6 shadow-lg">
          <p className="text-gray-900 dark:text-white font-bold text-xl text-center">⚠️ Service Currently Unavailable</p>
          <p className="text-gray-900 dark:text-amber-50 text-center mt-2">
            Our printing service is temporarily unavailable. Orders may be delayed.
          </p>
        </div>
      )}

      {!session?.user?.isVerified && (
        <div className="mb-8 bg-yellow-100 dark:bg-gray-800 border-2 border-yellow-600 dark:border-yellow-600 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-800 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 dark:text-yellow-500 mb-1">Account Pending Verification</h3>
              <p className="text-yellow-900 dark:text-yellow-100 mb-3">
                Your account is awaiting admin approval. You will be able to place orders once verified. If you are already verified then logout and login again.
              </p>
              <a
                href={`https://wa.me/${settings.adminContactPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Please verify my account: ${session?.user?.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Request Verification
              </a>
            </div>
          </div>
        </div>
      )}

      {/* New Print and My Orders Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* New Print Card */}
        <Link
          href="/dashboard/new"
          className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-transparent hover:border-indigo-600 dark:hover:border-indigo-500 hover:-translate-y-1 ${
            !session?.user?.isVerified ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-300 group-hover:scale-110">
              <PlusCircle className="h-10 w-10 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">New Print</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upload a document and place a new print order
            </p>
          </div>
        </Link>

        {/* My Orders Card */}
        <Link
          href="/dashboard/history"
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-transparent hover:border-indigo-600 dark:hover:border-indigo-500 hover:-translate-y-1"
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-300 group-hover:scale-110">
              <History className="h-10 w-10 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Orders</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View order history and track current orders
            </p>
          </div>
        </Link>
      </div>

      {/* Service Items Pricing */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Service Items</h2>
        <div className="space-y-4">
          {settings.serviceItems
            .filter((item: any) => item.isActive)
            .map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600"
              >
                <div className="flex-1">
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{item.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[80px]">
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">₹{item.price}</p>
                  </div>
                  <div className="px-5 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold rounded-lg min-w-[100px] text-center">
                    Active
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner Name */}
          <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Owner Name</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{settings.adminContactName}</p>
            </div>
          </div>
          
          {/* Phone Number */}
          <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Phone Number</p>
              <a
                href={`https://wa.me/${settings.adminContactPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
              >
                {settings.adminContactPhone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
