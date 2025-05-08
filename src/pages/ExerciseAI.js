// src/pages/ExerciseAI.js
import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding-top: 80px;
  min-height: 100vh;
  background-color: gray;
  padding-left: 1rem;
  padding-right: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const ToggleButton = styled.button`
  background-color: ${({ active }) => (active ? '#333' : '#ddd')};
  color: ${({ active }) => (active ? '#fff' : '#000')};
  border: none;
  padding: 0.75rem 1.5rem;
  margin: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
`;

const ExerciseButton = styled.button`
  background-color: #fff;
  color: #333;
  border: 1px solid #ccc;
  padding: 0.75rem 1rem;
  margin: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    background-color: #eee;
  }
`;

const VideoContainer = styled.div`
  margin-top: 2rem;
`;

const ExerciseAI = () => {
  const [selectedPart, setSelectedPart] = useState(null); // 'upper' or 'lower'
  const [selectedExercise, setSelectedExercise] = useState(null); // 운동 부위

  // 운동별 예시 영상 URL
  const exerciseVideos = {
    chest: 'https://www.youtube.com/embed/7ZJZm1oyfvY',
    shoulder: 'https://www.youtube.com/embed/2V3E3-rCddg',
    lat: 'https://www.youtube.com/embed/VZyU8Nsc4M4',
    arm: 'https://www.youtube.com/embed/MrHKq6S8Rf4',
    quad: 'https://www.youtube.com/embed/G3p0q1-FqS8',
    glute: 'https://www.youtube.com/embed/D2Zqp5W2Wgw',
    hamstring: 'https://www.youtube.com/embed/yG6ZaZQqTW4',
    calf: 'https://www.youtube.com/embed/Ue20tRJIglo',
  };

  // 각 운동 부위 버튼
  const upperExercises = ['chest', 'shoulder', 'lat', 'arm'];
  const lowerExercises = ['quad', 'glute', 'hamstring', 'calf'];

  return (
    <Container>
      <Title>운동을 선택해주세요.</Title>

      {/* 상체 / 하체 토글 버튼 */}
      <div>
        <ToggleButton
          active={selectedPart === 'upper'}
          onClick={() => {
            setSelectedPart('upper');
            setSelectedExercise(null);
          }}
        >
          상체 운동
        </ToggleButton>
        <ToggleButton
          active={selectedPart === 'lower'}
          onClick={() => {
            setSelectedPart('lower');
            setSelectedExercise(null);
          }}
        >
          하체 운동
        </ToggleButton>
      </div>

      {/* 선택된 부위의 세부 버튼 */}
      <div>
        {selectedPart === 'upper' &&
          upperExercises.map((exercise) => (
            <ExerciseButton
              key={exercise}
              onClick={() => setSelectedExercise(exercise)}
            >
              {{
                chest: '가슴',
                shoulder: '어깨',
                lat: '등',
                arm: '팔',
              }[exercise]}
            </ExerciseButton>
          ))}

        {selectedPart === 'lower' &&
          lowerExercises.map((exercise) => (
            <ExerciseButton
              key={exercise}
              onClick={() => setSelectedExercise(exercise)}
            >
              {{
                quad: '대퇴사두근',
                glute: '둔근',
                hamstring: '햄스트링',
                calf: '종아리',
              }[exercise]}
            </ExerciseButton>
          ))}
      </div>

      {/* 선택된 운동 영상 */}
      {selectedExercise && (
        <VideoContainer>
          <h2>
            {{
              chest: '가슴 운동',
              shoulder: '어깨 운동',
              lat: '등 운동',
              arm: '팔 운동',
              quad: '대퇴사두근 운동',
              glute: '둔근 운동',
              hamstring: '햄스트링 운동',
              calf: '종아리 운동',
            }[selectedExercise]}
          </h2>
          <iframe
            width="560"
            height="315"
            src={exerciseVideos[selectedExercise]}
            title="운동 영상"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </VideoContainer>
      )}
    </Container>
  );
};

export default ExerciseAI;
