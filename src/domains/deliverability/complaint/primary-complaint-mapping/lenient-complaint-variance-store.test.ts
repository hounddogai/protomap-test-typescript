import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientComplaintVarianceStore } from "./lenient-complaint-variance-store.js";
import { newLenientComplaintVariance } from "./lenient-complaint-variance.js";

test("MemoryLenientComplaintVarianceStore finds what it saved", () => {
  const store = newMemoryLenientComplaintVarianceStore();
  const item = newLenientComplaintVariance("code-564", "title-394");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
