export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

let _dummyPassword: string | undefined;

export function getDummyPassword(): string {
  if (_dummyPassword === undefined) {
    const { generateDummyPassword } = require('./db/utils');
    _dummyPassword = generateDummyPassword();
  }
  if (!_dummyPassword) {
    throw new Error('Failed to generate dummy password');
  }
  return _dummyPassword;
}
