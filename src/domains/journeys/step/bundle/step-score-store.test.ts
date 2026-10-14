import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepScoreStore } from "./step-score-store.js";
import { newStepScore } from "./step-score.js";

test("MemoryStepScoreStore finds what it saved", () => {
  const store = newMemoryStepScoreStore();
  const item = newStepScore("code-615", "label-864");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
