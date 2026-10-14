import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalEnrollmentThresholdStore } from "./seasonal-enrollment-threshold-store.js";
import { newSeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

test("MemorySeasonalEnrollmentThresholdStore finds what it saved", () => {
  const store = newMemorySeasonalEnrollmentThresholdStore();
  const item = newSeasonalEnrollmentThreshold("code-230", "label-900");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
