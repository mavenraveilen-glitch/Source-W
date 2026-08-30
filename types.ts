export type ResourceFile = {
  url: string;
  content: string;
  name: string;
  lines: number;
};

export type ExtractResult = {
  status: 'success' | 'error';
  html: string;
  css: ResourceFile[];
  js: ResourceFile[];
  title?: string;
  finalUrl?: string;
  message?: string;
};

export type EditorFile = {
  id: string;
  name: string;
  type: 'html' | 'css' | 'js';
  content: string;
  lines: number;
  url?: string;
};
