import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleScoreStore } from "./exit-rule-score-store.js";
import { newExitRuleScore } from "./exit-rule-score.js";

test("MemoryExitRuleScoreStore finds what it saved", () => {
  const store = newMemoryExitRuleScoreStore();
  const item = newExitRuleScore("code-718", "name-958");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
