import { useState } from "react";

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600">CareerCompass</h1>
        <p className="text-gray-600"> Guide to choose right career </p>
      </header>

      <main className="space-y-6">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Get Started
        </button>
        <p className="text-gray-700">
          This is a simple React + Tailwind setup. We’ll add real features
          later.
        </p>
      </main>

      <footer className="mt-10 text-sm text-gray-500">
        © 2026 CareerCompass Project
      </footer>
    </div>
  );
}

export default App;
