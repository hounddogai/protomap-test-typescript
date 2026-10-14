import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveNudgePreferenceStore } from "./adaptive-nudge-preference-store.js";
import { newAdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

test("MemoryAdaptiveNudgePreferenceStore finds what it saved", () => {
  const store = newMemoryAdaptiveNudgePreferenceStore();
  const item = newAdaptiveNudgePreference("code-717", "label-438");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
