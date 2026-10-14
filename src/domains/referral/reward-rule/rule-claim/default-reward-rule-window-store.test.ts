import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultRewardRuleWindowStore } from "./default-reward-rule-window-store.js";
import { newDefaultRewardRuleWindow } from "./default-reward-rule-window.js";

test("MemoryDefaultRewardRuleWindowStore finds what it saved", () => {
  const store = newMemoryDefaultRewardRuleWindowStore();
  const item = newDefaultRewardRuleWindow("code-305", "title-248");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
