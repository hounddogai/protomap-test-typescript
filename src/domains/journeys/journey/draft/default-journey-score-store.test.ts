import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultJourneyScoreStore } from "./default-journey-score-store.js";
import { newDefaultJourneyScore } from "./default-journey-score.js";

test("MemoryDefaultJourneyScoreStore finds what it saved", () => {
  const store = newMemoryDefaultJourneyScoreStore();
  const item = newDefaultJourneyScore("code-138", "name-643");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
