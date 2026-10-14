import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultNudgeScoreStore } from "./default-nudge-score-store.js";
import { newDefaultNudgeScore } from "./default-nudge-score.js";

test("MemoryDefaultNudgeScoreStore finds what it saved", () => {
  const store = newMemoryDefaultNudgeScoreStore();
  const item = newDefaultNudgeScore("code-822", "label-646");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
