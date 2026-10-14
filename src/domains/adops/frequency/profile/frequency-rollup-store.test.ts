import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyRollupStore } from "./frequency-rollup-store.js";
import { newFrequencyRollup } from "./frequency-rollup.js";

test("MemoryFrequencyRollupStore finds what it saved", () => {
  const store = newMemoryFrequencyRollupStore();
  const item = newFrequencyRollup("code-130", "name-815");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
