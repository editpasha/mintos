'use client';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gray-100 border-t border-gray-200 p-2 text-center text-sm text-gray-600">
      {process.env.NODE_ENV !== 'production' && (
        <span>You are in the {process.env.NODE_ENV} environment</span>
      )}
    </footer>
  );
}
