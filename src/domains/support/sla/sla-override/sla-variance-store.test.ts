import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaVarianceStore } from "./sla-variance-store.js";
import { newSlaVariance } from "./sla-variance.js";

test("MemorySlaVarianceStore finds what it saved", () => {
  const store = newMemorySlaVarianceStore();
  const item = newSlaVariance("code-757", "title-652");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
