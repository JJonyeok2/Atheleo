import axios from 'axios';

export const predictBodyType = async (data) => {
  const response = await axios.post('http://98.82.223.129:3000/predict', data);
  return response.data;
};
