import { usePredictDiseaseMutation } from '@/services/plantApi';
import React, { useState } from 'react';


const PlantDiseaseDetection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [predictDisease, { data, error, isLoading }] =
    usePredictDiseaseMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (file) {
      try {
        await predictDisease(file).unwrap();
      } catch (err) {
        console.error('Prediction error:', err);
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">
        🌿 Plant Disease Detector
      </h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={!file || isLoading}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
      >
        {isLoading ? 'Predicting...' : 'Predict'}
      </button>

      {error && (
        <div className="mt-4 text-red-600 font-semibold">
          {(error as any).data?.error || 'Something went wrong'}
        </div>
      )}

      {data && (
        <div className="mt-6 border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Prediction Result</h2>

          <img
            src={`http://localhost:5000${data.image_url}`}
            alt="Uploaded"
            className="w-64 h-64 object-cover rounded mb-4"
          />

          <p className="text-lg">
            <span className="font-semibold">Prediction:</span>{' '}
            {data.prediction}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Confidence:</span>{' '}
            {data.confidence}%
          </p>
          {data.message && (
            <p className="text-red-500 mt-2">{data.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlantDiseaseDetection;
