const path = require('path')

// https://github.com/imbhargav5/nextbase-nextjs13-supabase-starter/blob/main/.eslintrc.cjs
// https://stackoverflow.com/questions/69513869/eslint-8-0-0-failed-to-load-plugin-typescript-eslint
// https://the-guild.dev/graphql/eslint/docs/getting-started

module.exports = {
    root: true,
    extends: ['plugin:@next/next/recommended'],
    ignorePatterns: ['src/generated/**/*'],
    overrides: [
        {
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'plugin:@next/next/recommended',
                'plugin:tailwindcss/recommended',
                'prettier',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
            plugins: ['@typescript-eslint', 'tailwindcss', 'prettier', './eslint-rules'],
            rules: {
                'prettier/prettier': 1,
                'no-html-link-for-pages': 'off',
                'eslint(react-hooks/exhaustive-deps)': 'off',
                'react-hooks/exhaustive-deps': 'off',
                // Allow single-line if statements
                'curly': ['error', 'multi-line'],
                'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
                // Comment style enforcement
                'eslint-rules/comment-style': 'warn',
                // Tailwind CSS rules
                'tailwindcss/no-custom-classname': 'warn',
                'tailwindcss/no-contradicting-classname': 'error',
                'tailwindcss/classnames-order': 'error',
                // Import consistency rules
                'no-restricted-imports': [
                    'warn',
                    {
                        patterns: [
                            {
                                group: ['@/config/*', '!@/config'],
                                message: 'Use barrel import from @/config instead of direct file imports',
                            },
                            {
                                group: ['@/enums/*', '!@/enums'],
                                message: 'Use barrel import from @/enums instead of direct file imports',
                            },
                            {
                                group: ['@/utils/*', '!@/utils'],
                                message: 'Use barrel import from @/utils instead of direct file imports',
                            },
                            {
                                group: ['@/interfaces/*', '!@/interfaces'],
                                message: 'Use barrel import from @/interfaces instead of direct file imports',
                            },
                            {
                                group: ['@/services/core/*', '!@/services/core', '!@/services'],
                                message: 'Use barrel import from @/services or @/services/core instead of direct file imports',
                            },
                            {
                                group: ['@/services/explorers/*', '!@/services/explorers', '!@/services'],
                                message: 'Use barrel import from @/services or @/services/explorers instead of direct file imports',
                            },
                        ],
                    },
                ],
            },
            files: ['src/**/*.ts', 'src/**/*.tsx', 'scripts/**/*.ts', './tailwind.config.ts', './src/app/global.css'],
        },
        {
            extends: ['prettier'],
            files: ['*.js', 'scripts/**/*.js'],
            rules: {},
        },
        {
            extends: ['prettier'],
            files: '*.cjs',
            rules: {},
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                tsconfigRootDir: __dirname,
            },
        },
        {
            files: ['*.graphql'],
            parser: '@graphql-eslint/eslint-plugin',
            plugins: ['@graphql-eslint'],
            rules: { '@graphql-eslint/known-type-names': 'error' },
        },
    ],
    settings: {
        tailwindcss: {
            config: path.join(__dirname, './tailwind.config.ts'),
        },
    },
    rules: {
        '@next/next/no-html-link-for-pages': 'off',
    },
}
