import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackOptOutBaselineStore } from "./fallback-opt-out-baseline-store.js";
import { newFallbackOptOutBaseline } from "./fallback-opt-out-baseline.js";

test("MemoryFallbackOptOutBaselineStore finds what it saved", () => {
  const store = newMemoryFallbackOptOutBaselineStore();
  const item = newFallbackOptOutBaseline("code-131", "label-63");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
