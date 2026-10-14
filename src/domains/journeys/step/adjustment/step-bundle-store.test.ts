import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepBundleStore } from "./step-bundle-store.js";
import { newStepBundle } from "./step-bundle.js";

test("MemoryStepBundleStore finds what it saved", () => {
  const store = newMemoryStepBundleStore();
  const item = newStepBundle("code-431", "title-583");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
