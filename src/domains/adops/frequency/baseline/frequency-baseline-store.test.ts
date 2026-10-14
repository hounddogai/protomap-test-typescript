import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyBaselineStore } from "./frequency-baseline-store.js";
import { newFrequencyBaseline } from "./frequency-baseline.js";

test("MemoryFrequencyBaselineStore finds what it saved", () => {
  const store = newMemoryFrequencyBaselineStore();
  const item = newFrequencyBaseline("code-372", "name-648");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
