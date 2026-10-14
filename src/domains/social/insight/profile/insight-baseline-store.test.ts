import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightBaselineStore } from "./insight-baseline-store.js";
import { newInsightBaseline } from "./insight-baseline.js";

test("MemoryInsightBaselineStore finds what it saved", () => {
  const store = newMemoryInsightBaselineStore();
  const item = newInsightBaseline("code-608", "name-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
