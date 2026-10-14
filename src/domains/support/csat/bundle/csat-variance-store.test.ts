import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatVarianceStore } from "./csat-variance-store.js";
import { newCsatVariance } from "./csat-variance.js";

test("MemoryCsatVarianceStore finds what it saved", () => {
  const store = newMemoryCsatVarianceStore();
  const item = newCsatVariance("code-649", "label-789");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
