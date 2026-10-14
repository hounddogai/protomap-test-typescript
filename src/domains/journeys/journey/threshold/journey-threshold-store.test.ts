import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyThresholdStore } from "./journey-threshold-store.js";
import { newJourneyThreshold } from "./journey-threshold.js";

test("MemoryJourneyThresholdStore finds what it saved", () => {
  const store = newMemoryJourneyThresholdStore();
  const item = newJourneyThreshold("code-104", "label-764");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
