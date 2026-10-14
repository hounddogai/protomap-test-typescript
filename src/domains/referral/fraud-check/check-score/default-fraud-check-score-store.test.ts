import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFraudCheckScoreStore } from "./default-fraud-check-score-store.js";
import { newDefaultFraudCheckScore } from "./default-fraud-check-score.js";

test("MemoryDefaultFraudCheckScoreStore finds what it saved", () => {
  const store = newMemoryDefaultFraudCheckScoreStore();
  const item = newDefaultFraudCheckScore("code-2", "label-586");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
