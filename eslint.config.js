import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'supabase/functions/**', '.vercel'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Solo las dos reglas clásicas de hooks — el resto del "recommended" de
      // v7 asume que el proyecto usa el React Compiler, que este no usa, y
      // marca como error patrones existentes y correctos en todo el código.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // catch(_) {} vacíos son un patrón deliberado y extendido en este código
      // (silenciar errores de red no críticos)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // el estilo `cond && doSomething()` como sentencia se usa en todo el código
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },
);
