type ExportModule = typeof import("node:module");

const { createRequire: exportCreateRequire } = process.getBuiltinModule(
  "module"
) as ExportModule;
const exportRequire = exportCreateRequire(__filename);
const { writeDatasetSnapshot: exportWriteDatasetSnapshot } = exportRequire(
  "./build-dataset.ts"
) as {
  writeDatasetSnapshot: () => unknown;
};

exportWriteDatasetSnapshot();
