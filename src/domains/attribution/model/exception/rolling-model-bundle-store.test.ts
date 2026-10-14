import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingModelBundleStore } from "./rolling-model-bundle-store.js";
import { newRollingModelBundle } from "./rolling-model-bundle.js";

test("MemoryRollingModelBundleStore finds what it saved", () => {
  const store = newMemoryRollingModelBundleStore();
  const item = newRollingModelBundle("code-455", "label-161");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
