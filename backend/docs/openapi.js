/**
 * SEO Gen AI — Complete OpenAPI 3.0 Specification
 * Served at GET /api/docs (Swagger UI) and GET /api/docs.json (raw spec)
 */

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SEO Gen AI API',
    version: '1.0.0',
    description: `
## SEO Gen AI — REST API

Full-stack SaaS platform for AI-powered SEO article generation, WordPress publishing, and content management.

### Authentication
Most endpoints require a **Bearer JWT token**. Obtain one via \`POST /api/auth/login\` or \`POST /api/auth/register\`.

\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### Rate Limits
| Scope | Limit |
|---|---|
| Global | 100 req / 15 min / IP |
| Auth (login/register) | 5 req / 15 min / IP |
| Article generation | 5 req / 15 min / IP |
    `,
    contact: { name: 'SEO Gen AI Support', email: 'support@seogenai.com' },
    license: { name: 'Commercial License' },
  },
  servers: [
    { url: '/api', description: 'Current server' },
  ],
  tags: [
    { name: 'Auth', description: 'Registration, login, profile, GDPR' },
    { name: 'Articles', description: 'Generate, refine, history, export, WordPress' },
    { name: 'Images', description: 'Cover image upload and AI generation' },
    { name: 'Settings', description: 'User and system settings' },
    { name: 'Admin', description: 'Admin-only user management and stats' },
    { name: 'Payments', description: 'Stripe credit purchases and subscriptions' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login or /auth/register',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a8f2c3e4b0a1b2c3d4e5f6' },
          name: { type: 'string', example: 'Alice Martin' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          credits: { type: 'integer', example: 10 },
          plan: { type: 'string', enum: ['free', 'starter', 'growth', 'pro'], example: 'free' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        ],
      },
      Article: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64b9a1f2e5c0b2c3d4e5f7a8' },
          user: { type: 'string', example: '64a8f2c3e4b0a1b2c3d4e5f6' },
          keyword: { type: 'string', example: 'sustainable fashion' },
          title: { type: 'string', example: 'The Complete Guide to Sustainable Fashion in 2025' },
          metaDescription: { type: 'string', example: 'Discover the best sustainable fashion brands...' },
          content: { type: 'string', example: '# Introduction\n\nSustainable fashion...' },
          suggestedKeywords: { type: 'array', items: { type: 'string' }, example: ['eco fashion', 'green clothing'] },
          coverImageId: { type: 'string', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ArticleVersion: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          metaDescription: { type: 'string' },
          content: { type: 'string' },
          refinedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          pages: { type: 'integer', example: 4 },
          limit: { type: 'integer', example: 12 },
        },
      },
      UserSettings: {
        type: 'object',
        properties: {
          userApiKey: { type: 'string', example: 'sk-...' },
          userBaseUrl: { type: 'string', example: 'https://openrouter.ai/api/v1' },
          preferredModel: { type: 'string', example: 'gpt-4o' },
          defaultLanguage: { type: 'string', enum: ['English', 'French', 'Spanish', 'German', 'Arabic', 'Portuguese', 'Italian'] },
          defaultTone: { type: 'string', enum: ['Professional', 'Informative', 'Conversational', 'Persuasive', 'Creative'] },
          wpUrl: { type: 'string', example: 'https://myblog.com' },
          wpUsername: { type: 'string', example: 'admin' },
        },
      },
      SystemSettings: {
        type: 'object',
        properties: {
          openaiApiKey: { type: 'string', example: 'sk-...' },
          defaultModel: { type: 'string', example: 'gpt-4o' },
          allowUserKeys: { type: 'boolean', example: true },
          defaultUserCredits: { type: 'integer', example: 10 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'An error occurred.' },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully.' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Not authorized, no token' } } },
      },
      Forbidden: {
        description: 'Admin access required',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Article not found.' } } },
      },
      ValidationError: {
        description: 'Request body failed schema validation',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {

    // ── AUTH ──────────────────────────────────────────────────────────────────

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 100, example: 'Alice Martin' },
                  email: { type: 'string', format: 'email', example: 'alice@example.com' },
                  password: { type: 'string', minLength: 6, example: 'securepassword' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created. First registered user becomes admin.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive a JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'alice@example.com' },
                  password: { type: 'string', example: 'securepassword' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Missing fields' },
          401: { description: 'Invalid credentials' },
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        responses: {
          200: { description: 'Current user object', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset email',
        security: [],
        description: 'Always returns 200 to prevent email enumeration.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
        },
        responses: {
          200: { description: 'Reset link sent (if account exists)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    '/auth/reset-password/{token}': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using a valid token',
        security: [],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' }, description: 'Raw reset token from the email link' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string', minLength: 6 } } } } },
        },
        responses: {
          200: { description: 'Password updated successfully' },
          400: { description: 'Invalid or expired token, or password too short' },
        },
      },
    },

    '/auth/settings': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user personal settings',
        responses: {
          200: { description: 'User settings', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, settings: { $ref: '#/components/schemas/UserSettings' } } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Update personal settings (API key, WordPress, preferences)',
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserSettings' } } },
        },
        responses: {
          200: { description: 'Settings updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, settings: { $ref: '#/components/schemas/UserSettings' } } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/auth/account': {
      delete: {
        tags: ['Auth'],
        summary: 'Delete own account and all data (GDPR right to erasure)',
        description: 'Permanently deletes the user account, all articles, and all cover images from storage.',
        responses: {
          200: { description: 'Account deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { description: 'Server error during deletion' },
        },
      },
    },

    // ── ARTICLES ──────────────────────────────────────────────────────────────

    '/generate-article': {
      post: {
        tags: ['Articles'],
        summary: 'Generate a complete SEO article (non-streaming)',
        description: 'Uses the configured AI model to generate title, meta description, article body, and keyword suggestions. Costs 1 credit unless user has their own API key.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['keyword'], properties: { keyword: { type: 'string', maxLength: 100, example: 'sustainable fashion 2025' } } } } },
        },
        responses: {
          200: { description: 'Article generated and saved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Article' } } } } } },
          400: { description: 'Invalid keyword or AI configuration error' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Insufficient credits' },
          500: { description: 'AI generation failed' },
        },
      },
    },

    '/articles/stream': {
      post: {
        tags: ['Articles'],
        summary: 'Generate an article with real-time streaming (SSE)',
        description: 'Returns a `text/event-stream` response. Events: `status`, `meta`, `delta`, `done`, `error`.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['keyword'], properties: { keyword: { type: 'string', maxLength: 100 } } } } },
        },
        responses: {
          200: { description: 'SSE stream opened', content: { 'text/event-stream': { schema: { type: 'string' } } } },
          400: { description: 'Invalid keyword' },
          403: { description: 'Insufficient credits' },
        },
      },
    },

    '/history': {
      get: {
        tags: ['Articles'],
        summary: 'Get article history for the current user',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12, maximum: 50 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Filter by title or keyword' },
        ],
        responses: {
          200: {
            description: 'Paginated article list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/history/{id}/refine': {
      patch: {
        tags: ['Articles'],
        summary: 'Refine an article with an editorial prompt',
        description: 'Rewrites the article based on the prompt. Current version is saved to history (max 10 versions).',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['prompt'], properties: { prompt: { type: 'string', maxLength: 2000, example: 'Make the intro more engaging and add statistics' } } } } },
        },
        responses: {
          200: { description: 'Article refined', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Article' } } } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/history/{id}/restore/{versionIndex}': {
      post: {
        tags: ['Articles'],
        summary: 'Restore a previous version of an article',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'versionIndex', in: 'path', required: true, schema: { type: 'integer', minimum: 0 } },
        ],
        responses: {
          200: { description: 'Version restored', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Article' } } } } } },
          400: { description: 'Invalid version index' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/articles/{id}': {
      delete: {
        tags: ['Articles'],
        summary: 'Delete an article (owner only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Article deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/articles/{id}/publish-wordpress': {
      post: {
        tags: ['Articles'],
        summary: 'Publish article to WordPress as draft',
        description: 'Requires WordPress URL, username, and application password in user settings.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Published to WordPress', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, url: { type: 'string' } } } } } },
          400: { description: 'WordPress not configured' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── IMAGES ────────────────────────────────────────────────────────────────

    '/articles/{id}/cover': {
      post: {
        tags: ['Images'],
        summary: 'Upload a cover image for an article',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } },
        },
        responses: {
          200: { description: 'Cover uploaded', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, coverImageId: { type: 'string' }, coverUrl: { type: 'string' } } } } } },
          400: { description: 'No file provided or invalid type' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/articles/{id}/generate-cover-ai': {
      post: {
        tags: ['Images'],
        summary: 'Generate an AI cover image using DALL-E 3',
        description: 'Generates a cover image based on the article title and keyword. Requires a valid OpenAI API key (DALL-E 3). The image is processed, uploaded to S3, and linked to the article.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customPrompt: { type: 'string', maxLength: 1000, description: 'Optional custom DALL-E prompt override', example: 'A minimalist flat illustration of fashion garments on a white background' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'AI cover generated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, coverImageId: { type: 'string' }, coverUrl: { type: 'string' } } } } } },
          400: { description: 'Prompt rejected by safety filter or bad API config' },
          401: { description: 'Invalid OpenAI API key' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { description: 'OpenAI rate limit reached' },
        },
      },
    },

    '/internal-links': {
      post: {
        tags: ['Articles'],
        summary: 'Generate internal link suggestions for article content',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', maxLength: 50000, description: 'Full article markdown content' },
                  knownUrls: { type: 'array', items: { type: 'string', format: 'uri' }, maxItems: 100 },
                  articleId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Linking suggestions returned' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── SETTINGS ──────────────────────────────────────────────────────────────

    '/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get settings (admin receives full system config + user list)',
        responses: {
          200: {
            description: 'Settings response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    systemSettings: { $ref: '#/components/schemas/SystemSettings' },
                    personalSettings: { type: 'object' },
                    users: { type: 'array', items: { $ref: '#/components/schemas/User' }, description: 'Admin only' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Settings'],
        summary: 'Update profile and optionally global settings (admin)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/UserSettings' },
                  {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      password: { type: 'string', minLength: 6 },
                      systemSettings: { $ref: '#/components/schemas/SystemSettings' },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          200: { description: 'Settings updated' },
          400: { description: 'Email taken or password too short' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get platform dashboard statistics',
        description: 'Returns total users, articles, revenue trends, daily chart data, and top keywords.',
        responses: {
          200: { description: 'Dashboard stats' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users with pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Paginated user list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/admin/users/{id}/credits': {
      put: {
        tags: ['Admin'],
        summary: 'Set credits for a specific user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['credits'], properties: { credits: { type: 'integer', minimum: 0, maximum: 1000000, example: 100 } } } } },
        },
        responses: {
          200: { description: 'Credits updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } } } },
          400: { description: 'Invalid credits value' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user account',
        description: 'Cannot delete your own admin account.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User deleted' },
          400: { description: 'Cannot delete own account' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── PAYMENTS ──────────────────────────────────────────────────────────────

    '/stripe/packages': {
      get: {
        tags: ['Payments'],
        summary: 'Get available credit packages',
        responses: {
          200: {
            description: 'Credit packages list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    packages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', enum: ['starter', 'growth', 'pro'] },
                          name: { type: 'string' },
                          credits: { type: 'integer' },
                          price: { type: 'number' },
                          currency: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/stripe/payment-intent': {
      post: {
        tags: ['Payments'],
        summary: 'Create a Stripe PaymentIntent for embedded checkout',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['packageId'], properties: { packageId: { type: 'string', enum: ['starter', 'growth', 'pro'] } } } } },
        },
        responses: {
          200: { description: 'PaymentIntent created', content: { 'application/json': { schema: { type: 'object', properties: { clientSecret: { type: 'string' } } } } } },
          400: { description: 'Invalid package' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/stripe/verify/{paymentIntentId}': {
      get: {
        tags: ['Payments'],
        summary: 'Verify a payment and credit the user',
        parameters: [{ name: 'paymentIntentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Payment verified and credits allocated' },
          400: { description: 'Payment not successful' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/health': {
      get: {
        tags: ['Auth'],
        summary: 'API health check',
        security: [],
        responses: {
          200: { description: 'API is running', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } } },
        },
      },
    },
  },
};

export default openApiSpec;
