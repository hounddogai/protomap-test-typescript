import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedConversionBundleStore } from "./batched-conversion-bundle-store.js";
import { newBatchedConversionBundle } from "./batched-conversion-bundle.js";

test("MemoryBatchedConversionBundleStore finds what it saved", () => {
  const store = newMemoryBatchedConversionBundleStore();
  const item = newBatchedConversionBundle("code-274", "label-86");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
