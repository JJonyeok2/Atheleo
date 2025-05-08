import React, { useState } from 'react';
import { predictBodyType } from './api/api';

export default function BodyTypePredict() {
  const [inputs, setInputs] = useState({
    shoulder: '',
    chest: '',
    waist: '',
    hip: '',
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const data = {
        shoulder: parseFloat(inputs.shoulder),
        chest: parseFloat(inputs.chest),
        waist: parseFloat(inputs.waist),
        hip: parseFloat(inputs.hip),
      };

      const res = await predictBodyType(data);
      setResult(res);
    } catch (error) {
      console.error('예측 실패:', error.response?.data || error.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">체형 예측</h1>
      <div className="grid gap-2">
        <input name="shoulder" placeholder="어깨" onChange={handleChange} />
        <input name="chest" placeholder="가슴" onChange={handleChange} />
        <input name="waist" placeholder="허리" onChange={handleChange} />
        <input name="hip" placeholder="엉덩이" onChange={handleChange} />
        <button onClick={handleSubmit}>예측하기</button>
      </div>

      {result && (
        <div className="mt-4">
          <p>코드: {result.code}</p>
          <p>유형: {result.type}</p>
        </div>
      )}
    </div>
  );
}
