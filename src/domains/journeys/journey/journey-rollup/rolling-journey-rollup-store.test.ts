import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingJourneyRollupStore } from "./rolling-journey-rollup-store.js";
import { newRollingJourneyRollup } from "./rolling-journey-rollup.js";

test("MemoryRollingJourneyRollupStore finds what it saved", () => {
  const store = newMemoryRollingJourneyRollupStore();
  const item = newRollingJourneyRollup("code-567", "label-109");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
