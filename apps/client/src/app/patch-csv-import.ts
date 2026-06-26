import Papa from 'papaparse';

const SYMBOL_FIELDS = new Set(['code', 'symbol', 'ticker']);

const originalParse = Papa.parse;

Papa.parse = function patchedParse<T>(
  input: string,
  config?: Papa.ParseConfig<T>
) {
  if (config && config.dynamicTyping === true) {
    config = {
      ...config,
      dynamicTyping: (field: string) => !SYMBOL_FIELDS.has(field.toLowerCase())
    };
  }
  return originalParse.call(Papa, input, config);
} as typeof Papa.parse;
