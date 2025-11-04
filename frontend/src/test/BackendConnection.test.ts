import axios from 'axios';

describe('Backend connection', () => {
  test('should return healthy response from backend', async () => {
    const response = await axios.get('http://localhost:5000/api/health');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('ok', true);
  });
});
