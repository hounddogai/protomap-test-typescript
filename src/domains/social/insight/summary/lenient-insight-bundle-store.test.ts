import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientInsightBundleStore } from "./lenient-insight-bundle-store.js";
import { newLenientInsightBundle } from "./lenient-insight-bundle.js";

test("MemoryLenientInsightBundleStore finds what it saved", () => {
  const store = newMemoryLenientInsightBundleStore();
  const item = newLenientInsightBundle("code-553", "name-610");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
