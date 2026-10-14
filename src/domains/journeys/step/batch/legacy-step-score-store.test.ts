import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyStepScoreStore } from "./legacy-step-score-store.js";
import { newLegacyStepScore } from "./legacy-step-score.js";

test("MemoryLegacyStepScoreStore finds what it saved", () => {
  const store = newMemoryLegacyStepScoreStore();
  const item = newLegacyStepScore("code-340", "title-972");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
