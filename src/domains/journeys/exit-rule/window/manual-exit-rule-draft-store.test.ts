import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualExitRuleDraftStore } from "./manual-exit-rule-draft-store.js";
import { newManualExitRuleDraft } from "./manual-exit-rule-draft.js";

test("MemoryManualExitRuleDraftStore finds what it saved", () => {
  const store = newMemoryManualExitRuleDraftStore();
  const item = newManualExitRuleDraft("code-664", "title-720");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
