/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  validUser: {
    email: 'test+valid@example.com',
    password: 'Test123!@#',
    displayName: 'Test User',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!',
  },
  newUser: {
    email: `test+${Date.now()}@example.com`,
    password: 'NewUser123!@#',
    displayName: 'New Test User',
  },
};

export const testRecipes = {
  sampleRecipe: {
    title: 'Healthy Chicken Salad',
    content: 'A delicious and nutritious chicken salad with mixed greens.',
  },
  searchableRecipe: {
    title: 'Vegan Pasta Primavera',
    content: 'A colorful pasta dish loaded with fresh vegetables.',
  },
};
