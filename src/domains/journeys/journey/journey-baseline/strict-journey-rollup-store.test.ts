import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictJourneyRollupStore } from "./strict-journey-rollup-store.js";
import { newStrictJourneyRollup } from "./strict-journey-rollup.js";

test("MemoryStrictJourneyRollupStore finds what it saved", () => {
  const store = newMemoryStrictJourneyRollupStore();
  const item = newStrictJourneyRollup("code-841", "label-304");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
