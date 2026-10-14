import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutVarianceStore } from "./opt-out-variance-store.js";
import { newOptOutVariance } from "./opt-out-variance.js";

test("MemoryOptOutVarianceStore finds what it saved", () => {
  const store = newMemoryOptOutVarianceStore();
  const item = newOptOutVariance("code-4", "name-425");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
