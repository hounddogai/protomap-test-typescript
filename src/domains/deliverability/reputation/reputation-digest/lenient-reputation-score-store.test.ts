import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientReputationScoreStore } from "./lenient-reputation-score-store.js";
import { newLenientReputationScore } from "./lenient-reputation-score.js";

test("MemoryLenientReputationScoreStore finds what it saved", () => {
  const store = newMemoryLenientReputationScoreStore();
  const item = newLenientReputationScore("code-923", "title-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
