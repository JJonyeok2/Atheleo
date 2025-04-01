import React, { useState } from 'react';
import { FaBars, FaTimes, FaPlay, FaPause } from 'react-icons/fa';

const exerciseCategories = [
  { id: 'upper', name: '상체', exercises: [
    { id: 'chest', name: '가슴', videoUrl: '/api/placeholder/640/360', description: '가슴 근육을 강화하는 운동입니다.' },
    { id: 'back', name: '등', videoUrl: '/api/placeholder/640/360', description: '등 근육을 강화하는 운동입니다.' },
    { id: 'shoulder', name: '어깨', videoUrl: '/api/placeholder/640/360', description: '어깨 근육을 강화하는 운동입니다.' },
    { id: 'arms', name: '팔', videoUrl: '/api/placeholder/640/360', description: '팔 근육을 강화하는 운동입니다.' },
  ]},
  { id: 'lower', name: '하체', exercises: [
    { id: 'legs', name: '다리', videoUrl: '/api/placeholder/640/360', description: '다리 근육을 강화하는 운동입니다.' },
    { id: 'glutes', name: '엉덩이', videoUrl: '/api/placeholder/640/360', description: '엉덩이 근육을 강화하는 운동입니다.' }
  ]}
];

const Sidebar = ({ open, toggle, selectCategory, selectedCategory }) => (
  <div className={`fixed inset-y-0 left-0 transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-300 w-64 bg-blue-800 text-white shadow-lg z-30`}>
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">운동 선택</h2>
      <nav>
        {exerciseCategories.map(category => (
          <button key={category.id} onClick={() => selectCategory(category)} className={`w-full p-3 text-left rounded-md mb-2 ${selectedCategory?.id === category.id ? 'bg-blue-600' : 'hover:bg-blue-700'}`}>{category.name}</button>
        ))}
      </nav>
    </div>
    <button onClick={toggle} className="absolute top-4 right-4 md:hidden text-white"><FaTimes size={24} /></button>
  </div>
);

const ExerciseSidebar = ({ open, category, selectExercise }) => (
  <div className={`fixed inset-y-0 left-64 transform ${open ? 'translate-x-0' : '-translate-x-full'} transition duration-300 w-64 bg-blue-700 text-white shadow-lg z-20`}>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4">{category?.name} 운동</h3>
      {category?.exercises.map(exercise => (
        <button key={exercise.id} onClick={() => selectExercise(exercise)} className="w-full p-3 text-left rounded-md mb-2 hover:bg-blue-600">{exercise.name}</button>
      ))}
    </div>
  </div>
);

const VideoPlayer = ({ exercise, isPlaying, togglePlayback }) => (
  <div className="w-full max-w-3xl">
    <h1 className="text-3xl font-bold mb-4">{exercise.name}</h1>
    <p className="mb-6 text-gray-600">{exercise.description}</p>
    <div className="relative w-full rounded-lg overflow-hidden shadow-xl bg-black">
      <img src={exercise.videoUrl} alt={exercise.name} className="w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <button onClick={togglePlayback} className="p-4 bg-white bg-opacity-30 rounded-full hover:bg-opacity-50 transition">
          {isPlaying ? <FaPause size={32} /> : <FaPlay size={32} />}
        </button>
      </div>
    </div>
  </div>
);

const ExerciseAI = () => {
  const [mainSidebarOpen, setMainSidebarOpen] = useState(false);
  const [exerciseSidebarOpen, setExerciseSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setExerciseSidebarOpen(true);
    setSelectedExercise(null);
  };

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setIsPlaying(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <button onClick={() => setMainSidebarOpen(!mainSidebarOpen)} className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-md md:hidden">
        {mainSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>
      
      <Sidebar open={mainSidebarOpen} toggle={() => setMainSidebarOpen(!mainSidebarOpen)} selectCategory={handleCategorySelect} selectedCategory={selectedCategory} />
      {selectedCategory && <ExerciseSidebar open={exerciseSidebarOpen} category={selectedCategory} selectExercise={handleExerciseSelect} />}
      
      <div className={`flex-1 ml-0 md:ml-64 ${exerciseSidebarOpen ? 'md:ml-128' : ''} transition-all duration-300 ease-in-out flex items-center justify-center`}> 
        {selectedExercise ? <VideoPlayer exercise={selectedExercise} isPlaying={isPlaying} togglePlayback={() => setIsPlaying(!isPlaying)} /> :
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6">운동 프로그램</h1>
            <p className="text-xl text-gray-600">왼쪽 사이드바에서 운동을 선택하세요.</p>
          </div>
        }
      </div>
    </div>
  );
};

export default ExerciseAI;