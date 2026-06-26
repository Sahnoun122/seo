import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  generateArticleSchema,
  refineArticleSchema,
  updateSettingsSchema,
  updateCreditsSchema,
  internalLinkingSchema,
} from '../validators/schemas.js';

// Helper: parse and return either { success, data } or { success: false, issues }
const parse = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, issues: result.error.issues.map((i) => i.message) };
};

// ─────────────────────────────────────────────────
// registerSchema
// ─────────────────────────────────────────────────
describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = parse(registerSchema, { name: 'Alice', email: 'alice@example.com', password: 'Secret123' });
    expect(result.success).toBe(true);
  });

  it('lowercases the email (schema applies .toLowerCase() transform)', () => {
    const result = parse(registerSchema, { name: 'Alice', email: 'ALICE@EXAMPLE.COM', password: 'Secret123' });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('alice@example.com');
  });

  it('rejects missing name', () => {
    const result = parse(registerSchema, { email: 'x@x.com', password: 'Secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = parse(registerSchema, { name: '', email: 'x@x.com', password: 'Secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 characters', () => {
    const result = parse(registerSchema, { name: 'a'.repeat(101), email: 'x@x.com', password: 'Secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = parse(registerSchema, { name: 'Alice', email: 'not-an-email', password: 'Secret123' });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/invalid email/i);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = parse(registerSchema, { name: 'Alice', email: 'x@x.com', password: 'Ab1' });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/8 characters/i);
  });

  it('rejects password without uppercase letter', () => {
    const result = parse(registerSchema, { name: 'Alice', email: 'x@x.com', password: 'secret123' });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/uppercase/i);
  });

  it('rejects password without a number', () => {
    const result = parse(registerSchema, { name: 'Alice', email: 'x@x.com', password: 'SecretPassword' });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/number/i);
  });

  it('rejects password longer than 128 characters', () => {
    const result = parse(registerSchema, { name: 'Alice', email: 'x@x.com', password: 'A1' + 'a'.repeat(127) });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// loginSchema
// ─────────────────────────────────────────────────
describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const result = parse(loginSchema, { email: 'user@example.com', password: 'anypassword' });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = parse(loginSchema, { password: 'anypassword' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = parse(loginSchema, { email: 'bad', password: 'anypassword' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = parse(loginSchema, { email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// forgotPasswordSchema
// ─────────────────────────────────────────────────
describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = parse(forgotPasswordSchema, { email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = parse(forgotPasswordSchema, { email: 'not-valid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = parse(forgotPasswordSchema, {});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// resetPasswordSchema
// ─────────────────────────────────────────────────
describe('resetPasswordSchema', () => {
  it('accepts a strong password of at least 8 chars with uppercase and number', () => {
    const result = parse(resetPasswordSchema, { password: 'Newpass1' });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = parse(resetPasswordSchema, { password: 'Ab1' });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/8 characters/i);
  });

  it('rejects password without uppercase letter', () => {
    const result = parse(resetPasswordSchema, { password: 'newpass1' });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/uppercase/i);
  });

  it('rejects password without a number', () => {
    const result = parse(resetPasswordSchema, { password: 'Newpassword' });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/number/i);
  });

  it('rejects password longer than 128 chars', () => {
    const result = parse(resetPasswordSchema, { password: 'A1' + 'a'.repeat(127) });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// generateArticleSchema
// ─────────────────────────────────────────────────
describe('generateArticleSchema', () => {
  it('accepts a valid keyword', () => {
    const result = parse(generateArticleSchema, { keyword: 'SEO strategies 2025' });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from keyword', () => {
    const result = parse(generateArticleSchema, { keyword: '  backlinks  ' });
    expect(result.data.keyword).toBe('backlinks');
  });

  it('rejects empty keyword', () => {
    const result = parse(generateArticleSchema, { keyword: '' });
    expect(result.success).toBe(false);
  });

  it('rejects keyword longer than 100 characters', () => {
    const result = parse(generateArticleSchema, { keyword: 'a'.repeat(101) });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/100 characters/i);
  });

  it('rejects missing keyword', () => {
    const result = parse(generateArticleSchema, {});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// refineArticleSchema
// ─────────────────────────────────────────────────
describe('refineArticleSchema', () => {
  it('accepts a valid prompt', () => {
    const result = parse(refineArticleSchema, { prompt: 'Make the intro more engaging' });
    expect(result.success).toBe(true);
  });

  it('rejects empty prompt', () => {
    const result = parse(refineArticleSchema, { prompt: '' });
    expect(result.success).toBe(false);
  });

  it('rejects prompt longer than 2000 characters', () => {
    const result = parse(refineArticleSchema, { prompt: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/2000/i);
  });
});

// ─────────────────────────────────────────────────
// updateCreditsSchema
// ─────────────────────────────────────────────────
describe('updateCreditsSchema', () => {
  it('accepts 0 credits', () => {
    const result = parse(updateCreditsSchema, { credits: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts a positive integer', () => {
    const result = parse(updateCreditsSchema, { credits: 500 });
    expect(result.success).toBe(true);
  });

  it('rejects negative credits', () => {
    const result = parse(updateCreditsSchema, { credits: -1 });
    expect(result.success).toBe(false);
    expect(result.issues[0]).toMatch(/0 or more/i);
  });

  it('rejects credits above 1 000 000', () => {
    const result = parse(updateCreditsSchema, { credits: 1_000_001 });
    expect(result.success).toBe(false);
  });

  it('rejects fractional credits', () => {
    const result = parse(updateCreditsSchema, { credits: 10.5 });
    expect(result.success).toBe(false);
  });

  it('rejects string instead of number', () => {
    const result = parse(updateCreditsSchema, { credits: '100' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// internalLinkingSchema
// ─────────────────────────────────────────────────
describe('internalLinkingSchema', () => {
  it('accepts content with no knownUrls', () => {
    const result = parse(internalLinkingSchema, { content: 'Some article text here.' });
    expect(result.success).toBe(true);
    expect(result.data.knownUrls).toEqual([]);
  });

  it('accepts content with valid URLs in knownUrls', () => {
    const result = parse(internalLinkingSchema, {
      content: 'Article text.',
      knownUrls: ['https://example.com/page-1', 'https://example.com/page-2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL in knownUrls array', () => {
    const result = parse(internalLinkingSchema, {
      content: 'Article text.',
      knownUrls: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty content', () => {
    const result = parse(internalLinkingSchema, { content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content longer than 50 000 characters', () => {
    const result = parse(internalLinkingSchema, { content: 'x'.repeat(50_001) });
    expect(result.success).toBe(false);
  });

  it('rejects knownUrls array with more than 100 items', () => {
    const result = parse(internalLinkingSchema, {
      content: 'Article text.',
      knownUrls: Array.from({ length: 101 }, (_, i) => `https://example.com/${i}`),
    });
    expect(result.success).toBe(false);
  });
});
