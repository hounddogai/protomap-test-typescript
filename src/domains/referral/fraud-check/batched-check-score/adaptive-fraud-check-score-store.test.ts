import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveFraudCheckScoreStore } from "./adaptive-fraud-check-score-store.js";
import { newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

test("MemoryAdaptiveFraudCheckScoreStore finds what it saved", () => {
  const store = newMemoryAdaptiveFraudCheckScoreStore();
  const item = newAdaptiveFraudCheckScore("code-63", "label-302");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
