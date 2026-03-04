export default function Intro({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">

      <h1 className="text-3xl font-bold mb-4">
        AI Document Search
      </h1>

      <p className="text-gray-600 mb-6">
        Upload your documents and ask questions using AI.
      </p>

      <button
        onClick={onStart}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Start
      </button>

    </div>
  );
}