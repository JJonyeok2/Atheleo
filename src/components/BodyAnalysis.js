import React from 'react';
import styled from 'styled-components';

// 스타일 구성
const Container = styled.div`
    padding: 20px;
    text-align: center;
`;

const Title = styled.h1`
    margin-bottom: 20px;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 4개의 열로 구성 */
    gap: 20px; /* 칸 간의 간격 */
`;

const ShapeCard = styled.div`
    border: 1px solid #ccc; /* 테두리 */
    border-radius: 8px; /* 모서리 둥글게 */
    padding: 10px;
    background-color: black; /* 배경색 */
    transition: transform 0.2s; /* 호버 효과에 부드러운 전환 */
    
    &:hover {
        transform: scale(1.05); /* 호버 시 약간 확대 */
    }
`;

const ShapeImage = styled.img`
    width: 100%; /* 이미지 너비를 카드에 맞춤 */
    border-radius: 8px; /* 이미지 모서리 둥글게 */
`;

// 체형 배열
const shapes = [
    { name: '표준체형', image: '/standard.png' },
    { name: '삼각체형', image: '/srevtri.png' },
    { name: '역삼각체형', image: '/btri.png' },
    { name: '사각체형', image: '/bsqr.png' },
    { name: '모래시계형', image: '/sqr.png' },
    { name: '마름모꼴체형', image: '/btri.png' },
    { name: '둥근 체형', image: '/sqr.png' },
    { name: '튜브 체형', image: '/btri.png' },
];

const BodyAnalysis = () => {
    return (
        <Container>
            <Title>AI 체형 분석</Title>
            <Grid>
                {shapes.map((shape, index) => (
                    <ShapeCard key={index}>
                        <ShapeImage src={shape.image} alt={shape.name} />
                        <h3>{shape.name}</h3>
                    </ShapeCard>
                ))}
            </Grid>
        </Container>
    );
};

export default BodyAnalysis;
