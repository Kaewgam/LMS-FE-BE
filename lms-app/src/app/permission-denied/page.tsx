'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PermissionDeniedContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'You do not have permission to access this resource.';
  return <p className="mt-4 text-lg text-gray-600">{message}</p>;
}

export default function PermissionDenied() {

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg text-center">
          <div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Permission Denied
            </h2>
            <div className="mt-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="mt-4 text-lg text-gray-600">
              <Suspense fallback={<div>Loading...</div>}>
                <PermissionDeniedContent />
              </Suspense>
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
  );
} 