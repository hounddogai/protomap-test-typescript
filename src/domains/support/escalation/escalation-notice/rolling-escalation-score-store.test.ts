import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingEscalationScoreStore } from "./rolling-escalation-score-store.js";
import { newRollingEscalationScore } from "./rolling-escalation-score.js";

test("MemoryRollingEscalationScoreStore finds what it saved", () => {
  const store = newMemoryRollingEscalationScoreStore();
  const item = newRollingEscalationScore("code-468", "name-563");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
