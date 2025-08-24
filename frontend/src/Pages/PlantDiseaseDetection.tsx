import { useState } from "react";
import { usePredictDiseaseMutation } from "@/services/plantApi";  // Adjust path if necessary

interface DiseaseInfo {
  causes?: string;
  symptoms?: string;
  treatment?: string[];
  prevention?: string[];
}

export default function PlantDiseaseDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCauses, setShowCauses] = useState(false);
  const [showPrevention, setShowPrevention] = useState(false);
  const [predictDisease, { data, isLoading, error }] = usePredictDiseaseMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Create a preview URL for the uploaded image
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      await predictDisease(file).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  // Clean up preview URL to prevent memory leaks
  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setShowCauses(false);
    setShowPrevention(false);
  };

  // Normalize confidence value
  const displayConfidence = data?.confidence
    ? (data.confidence > 1 ? data.confidence : data.confidence * 100).toFixed(2)
    : "0.00";

  // Ensure arrays are always defined
  const treatmentList = data?.info?.treatment ?? [];
  const preventionList = data?.info?.prevention ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold text-center">Plant Disease Detection</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0 file:text-sm file:font-semibold
        file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
      />

      <div className="flex space-x-4">
        <button
          onClick={handleSubmit}
          disabled={!file || isLoading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? "Detecting..." : "Detect Disease"}
        </button>
        {file && (
          <button
            onClick={handleClear}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-center">Failed to detect disease. Please try again.</p>}

      {data && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold text-center text-green-700">
            {data.prediction} (Confidence: {displayConfidence}%)
          </h2>

          {(previewUrl || data.image_url) && (
            <div className="mt-4">
              <h3 className="text-lg font-bold">Uploaded Image</h3>
              <img
                src={previewUrl || data.image_url}
                alt="Uploaded plant"
                className="mt-2 max-w-full h-auto rounded-lg shadow-md"
                style={{ maxHeight: "300px" }}
              />
            </div>
          )}

          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => setShowCauses(!showCauses)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              {showCauses ? "Hide Causes" : "Show Causes"}
            </button>
            <button
              onClick={() => setShowPrevention(!showPrevention)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              {showPrevention ? "Hide Prevention" : "Show Prevention"}
            </button>
          </div>

          {showCauses && data.info?.causes && (
            <div className="mt-4">
              <h3 className="text-lg font-bold">Causes</h3>
              <p>{data.info.causes}</p>
            </div>
          )}

          {data.info?.symptoms && (
            <div className="mt-4">
              <h3 className="text-lg font-bold">Symptoms</h3>
              <p>{data.info.symptoms}</p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-lg font-bold">Treatment</h3>
            {treatmentList.length > 0 ? (
              <ul className="list-disc list-inside">
                {treatmentList.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No treatment information available.</p>
            )}
          </div>

          {showPrevention && (
            <div className="mt-4">
              <h3 className="text-lg font-bold">Prevention</h3>
              {preventionList.length > 0 ? (
                <ul className="list-disc list-inside">
                  {preventionList.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No prevention information available.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}