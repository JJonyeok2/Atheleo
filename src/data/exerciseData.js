// src/data/exerciseData.js
export const exerciseCategories = [
    {
      id: 'upper',
      name: '상체',
      exercises: [
        { id: 'chest', name: '가슴', videoUrl: '/api/placeholder/640/360', description: '가슴 근육을 강화하는 운동입니다.' },
        { id: 'back', name: '등', videoUrl: '/api/placeholder/640/360', description: '등 근육을 강화하는 운동입니다.' },
        { id: 'shoulder', name: '어깨', videoUrl: '/api/placeholder/640/360', description: '어깨 근육을 강화하는 운동입니다.' },
        { id: 'arms', name: '팔', videoUrl: '/api/placeholder/640/360', description: '팔 근육을 강화하는 운동입니다.' },
      ],
    },
    {
      id: 'lower',
      name: '하체',
      exercises: [
        { id: 'legs', name: '다리', videoUrl: '/api/placeholder/640/360', description: '다리 근육을 강화하는 운동입니다.' },
        { id: 'glutes', name: '엉덩이', videoUrl: '/api/placeholder/640/360', description: '엉덩이 근육을 강화하는 운동입니다.' },
      ],
    },
  ];
  