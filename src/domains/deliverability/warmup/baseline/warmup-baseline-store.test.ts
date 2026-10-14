import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupBaselineStore } from "./warmup-baseline-store.js";
import { newWarmupBaseline } from "./warmup-baseline.js";

test("MemoryWarmupBaselineStore finds what it saved", () => {
  const store = newMemoryWarmupBaselineStore();
  const item = newWarmupBaseline("code-905", "name-106");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
