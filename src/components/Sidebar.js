// src/components/Sidebar.js
import React from 'react';
import { FaTimes } from 'react-icons/fa';
// Link 컴포넌트는 이 컴포넌트에서 직접 사용되지 않으므로 주석 처리하거나 제거했습니다.
// import { Link } from 'react-router-dom';

// Sidebar 컴포넌트는 open 상태, categories 데이터,
// 카테고리/운동 선택 시 호출될 함수들을 props로 받습니다.
// onSelectCategory prop은 현재 이 컴포넌트 내에서 직접적인 UI 변화(예: 하위 목록 토글)에
// 사용되지 않으며, 외부에서 카테고리 선택 이벤트를 처리하는 용도로 사용될 수 있습니다.
const Sidebar = ({ open, categories, onSelectCategory, onSelectExercise }) => (
  // 사이드바 컨테이너:
  // - `fixed inset-y-0 left-0`: 화면의 좌측에 고정
  // - `transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`:
  //    `open` 상태에 따라 좌우로 슬라이드 인/아웃 애니메이션 (모바일에서)
  // - `md:translate-x-0`: 데스크톱 크기에서는 항상 보이도록 설정 (MD 기준)
  // - `transition duration-300`: 애니메이션 속도 설정
  // - `w-64`: 너비 설정
  // - `bg-blue-800 text-white`: 배경색과 글자색 설정
  // - `shadow-lg z-30`: 그림자 효과 및 z-index 설정
  <div className={`fixed inset-y-0 left-0 transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-300 w-64 bg-blue-800 text-white shadow-lg z-30`}>
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">운동 선택</h2> {/* 사이드바 제목 */}
      <nav>
        {/* categories prop으로 전달받은 운동 카테고리 목록을 순회 */}
        {categories.map((category) => (
          // 각 카테고리 항목의 컨테이너
          <div key={category.id}>
            {/* 카테고리 이름 버튼 */}
            <button
              // onClick 이벤트 핸들러: onSelectCategory 함수 호출
              // 이 함수가 부모 컴포넌트(ExerciseAI)에서 어떤 동작을 하는지 확인 필요합니다.
              // (예: 해당 카테고리에 속한 운동 목록만 필터링 등)
              // 현재 Sidebar 컴포넌트 자체에서는 카테고리 클릭 시 하위 운동 목록이 토글되지 않습니다.
              onClick={() => onSelectCategory && onSelectCategory(category)} // onSelectCategory가 존재할 때만 호출
              // 카테고리 버튼 스타일: 박스 형태로 보이도록 배경색, 패딩, 모서리 둥글게, 그림자, 호버 효과 적용
              className="w-full p-3 text-left bg-blue-700 rounded-md mb-2 hover:bg-blue-600 transition-colors duration-200 shadow-sm focus:outline-none"
            >
              {category.name} {/* 카테고리 이름 표시 */}
            </button>
            {/* 해당 카테고리에 속한 하위 운동 목록을 순회 */}
            {/* 참고: 현재 코드에서는 하위 운동 목록이 카테고리 클릭과 상관없이 항상 표시됩니다.
                      카테고리 클릭 시 하위 목록을 토글하려면 상태 관리가 필요합니다. */}
            {category.exercises.map((exercise) => (
              // 각 운동 항목 버튼
              <button
                key={exercise.id}
                onClick={() => onSelectExercise && onSelectExercise(exercise)} // onSelectExercise가 존재할 때만 호출
                // 운동 항목 버튼 스타일: 카테고리 버튼과 유사하지만 구분을 위해 약간 다른 배경색과 들여쓰기 적용
                className="w-full p-3 text-left bg-blue-600 rounded-md mb-2 hover:bg-blue-500 transition-colors duration-200 shadow-sm pl-8 focus:outline-none" // pl-8로 왼쪽 패딩을 추가하여 들여쓰기 효과
              >
                {exercise.name} {/* 운동 이름 표시 */}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </div>
    {/* 사이드바 닫기 버튼 (모바일 크기에서만 표시) */}
    {/* onClick 이벤트 핸들러: onSelectCategory 함수에 null을 전달.
        이는 부모 컴포넌트에서 사이드바 닫기 로직과 연결되어 있어야 합니다. */}
    <button
      onClick={() => onSelectCategory && onSelectCategory(null)} // onSelectCategory가 존재할 때만 호출
      className="absolute top-4 right-4 md:hidden text-white focus:outline-none"
    >
      <FaTimes size={24} /> {/* 닫기 아이콘 표시 */}
    </button>
  </div>
);

export default Sidebar;
