import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationPreferenceStore } from "./escalation-preference-store.js";
import { newEscalationPreference } from "./escalation-preference.js";

test("MemoryEscalationPreferenceStore finds what it saved", () => {
  const store = newMemoryEscalationPreferenceStore();
  const item = newEscalationPreference("code-150", "label-278");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
