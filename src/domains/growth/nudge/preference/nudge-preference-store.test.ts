import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgePreferenceStore } from "./nudge-preference-store.js";
import { newNudgePreference } from "./nudge-preference.js";

test("MemoryNudgePreferenceStore finds what it saved", () => {
  const store = newMemoryNudgePreferenceStore();
  const item = newNudgePreference("code-658", "name-898");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
