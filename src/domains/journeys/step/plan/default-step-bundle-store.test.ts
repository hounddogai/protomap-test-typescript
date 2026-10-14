import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultStepBundleStore } from "./default-step-bundle-store.js";
import { newDefaultStepBundle } from "./default-step-bundle.js";

test("MemoryDefaultStepBundleStore finds what it saved", () => {
  const store = newMemoryDefaultStepBundleStore();
  const item = newDefaultStepBundle("code-84", "label-799");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
