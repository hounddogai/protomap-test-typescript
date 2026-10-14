import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingNudgePreferenceStore } from "./rolling-nudge-preference-store.js";
import { newRollingNudgePreference } from "./rolling-nudge-preference.js";

test("MemoryRollingNudgePreferenceStore finds what it saved", () => {
  const store = newMemoryRollingNudgePreferenceStore();
  const item = newRollingNudgePreference("code-939", "label-52");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
