import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictExitRuleDraftStore } from "./strict-exit-rule-draft-store.js";
import { newStrictExitRuleDraft } from "./strict-exit-rule-draft.js";

test("MemoryStrictExitRuleDraftStore finds what it saved", () => {
  const store = newMemoryStrictExitRuleDraftStore();
  const item = newStrictExitRuleDraft("code-743", "title-558");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
