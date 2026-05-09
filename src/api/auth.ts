import request from './request';

export const login = async (username: string, password: string) => {
  const response = await request.post('/login', { username, password });
  return response.data;
};