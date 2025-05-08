// src/components/VideoPlayer.js
import React from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

const VideoPlayer = ({ exercise, isPlaying, togglePlayback }) => {
  return (
    <div className="w-full max-w-3xl bg-gray-100 p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">{exercise.name}</h1>
      <p className="mb-6 text-gray-600">{exercise.description}</p>

      {/* 비디오 플레이어 */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <video
          src={exercise.videoUrl}  // exercise에서 전달받은 videoUrl을 사용
          controls
          autoPlay={isPlaying}
          className="w-full"
        />

        {/* 플레이/일시정지 버튼 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={togglePlayback}
            className="p-4 bg-white bg-opacity-30 rounded-full hover:bg-opacity-50 transition"
          >
            {isPlaying ? (
              <FaPause size={32} color="white" />
            ) : (
              <FaPlay size={32} color="white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
