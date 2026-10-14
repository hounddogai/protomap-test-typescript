import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingJourneyBaselineStore } from "./rolling-journey-baseline-store.js";
import { newRollingJourneyBaseline } from "./rolling-journey-baseline.js";

test("MemoryRollingJourneyBaselineStore finds what it saved", () => {
  const store = newMemoryRollingJourneyBaselineStore();
  const item = newRollingJourneyBaseline("code-208", "title-987");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
