// Utility function to check localStorage authentication
export const isAuthenticated = () => {
  return !!localStorage.getItem('userEmail');
};
