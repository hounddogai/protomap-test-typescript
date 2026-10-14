import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictFrequencyRollupStore } from "./strict-frequency-rollup-store.js";
import { newStrictFrequencyRollup } from "./strict-frequency-rollup.js";

test("MemoryStrictFrequencyRollupStore finds what it saved", () => {
  const store = newMemoryStrictFrequencyRollupStore();
  const item = newStrictFrequencyRollup("code-676", "label-172");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
