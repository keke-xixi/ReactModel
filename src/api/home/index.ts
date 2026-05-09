import request from '../request';

interface getMenuParams {
  menuName: string;
}

export const getMenu = async (params: getMenuParams) => {
  return request.get('/menu', { params });
};