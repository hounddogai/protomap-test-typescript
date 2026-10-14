import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedInsightOverrideStore } from "./weighted-insight-override-store.js";
import { newWeightedInsightOverride } from "./weighted-insight-override.js";

test("MemoryWeightedInsightOverrideStore finds what it saved", () => {
  const store = newMemoryWeightedInsightOverrideStore();
  const item = newWeightedInsightOverride("code-95", "label-864");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
