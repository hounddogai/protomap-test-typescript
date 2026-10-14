import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationScoreStore } from "./reputation-score-store.js";
import { newReputationScore } from "./reputation-score.js";

test("MemoryReputationScoreStore finds what it saved", () => {
  const store = newMemoryReputationScoreStore();
  const item = newReputationScore("code-336", "label-13");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
