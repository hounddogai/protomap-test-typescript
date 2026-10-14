import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStepBundleStore } from "./capped-step-bundle-store.js";
import { newCappedStepBundle } from "./capped-step-bundle.js";

test("MemoryCappedStepBundleStore finds what it saved", () => {
  const store = newMemoryCappedStepBundleStore();
  const item = newCappedStepBundle("code-244", "title-492");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
