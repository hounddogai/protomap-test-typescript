import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPreferenceThresholdStore } from "./seasonal-preference-threshold-store.js";
import { newSeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

test("MemorySeasonalPreferenceThresholdStore finds what it saved", () => {
  const store = newMemorySeasonalPreferenceThresholdStore();
  const item = newSeasonalPreferenceThreshold("code-720", "label-399");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
