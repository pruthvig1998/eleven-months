// Lets the dev server read ../rules (the shared extractor and routing).
export default { server: { fs: { allow: ['..'] } } };
