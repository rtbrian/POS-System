import { authApi } from './api';

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await authApi.post('/login', { email, password });
    
    // Save the token to the browser's local storage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};