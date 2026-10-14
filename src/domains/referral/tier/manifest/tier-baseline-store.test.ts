import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierBaselineStore } from "./tier-baseline-store.js";
import { newTierBaseline } from "./tier-baseline.js";

test("MemoryTierBaselineStore finds what it saved", () => {
  const store = newMemoryTierBaselineStore();
  const item = newTierBaseline("code-578", "label-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
