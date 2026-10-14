import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleDraftStore } from "./exit-rule-draft-store.js";
import { newExitRuleDraft } from "./exit-rule-draft.js";

test("MemoryExitRuleDraftStore finds what it saved", () => {
  const store = newMemoryExitRuleDraftStore();
  const item = newExitRuleDraft("code-3", "title-118");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
