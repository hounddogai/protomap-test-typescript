import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveExitRuleDraftStore } from "./adaptive-exit-rule-draft-store.js";
import { newAdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

test("MemoryAdaptiveExitRuleDraftStore finds what it saved", () => {
  const store = newMemoryAdaptiveExitRuleDraftStore();
  const item = newAdaptiveExitRuleDraft("code-75", "name-537");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
