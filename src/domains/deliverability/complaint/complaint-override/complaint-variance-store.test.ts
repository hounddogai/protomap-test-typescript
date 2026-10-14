import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintVarianceStore } from "./complaint-variance-store.js";
import { newComplaintVariance } from "./complaint-variance.js";

test("MemoryComplaintVarianceStore finds what it saved", () => {
  const store = newMemoryComplaintVarianceStore();
  const item = newComplaintVariance("code-766", "name-881");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
