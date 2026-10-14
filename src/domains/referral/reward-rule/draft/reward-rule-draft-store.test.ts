import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleDraftStore } from "./reward-rule-draft-store.js";
import { newRewardRuleDraft } from "./reward-rule-draft.js";

test("MemoryRewardRuleDraftStore finds what it saved", () => {
  const store = newMemoryRewardRuleDraftStore();
  const item = newRewardRuleDraft("code-321", "name-539");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
