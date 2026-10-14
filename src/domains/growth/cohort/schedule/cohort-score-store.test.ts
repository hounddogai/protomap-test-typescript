import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortScoreStore } from "./cohort-score-store.js";
import { newCohortScore } from "./cohort-score.js";

test("MemoryCohortScoreStore finds what it saved", () => {
  const store = newMemoryCohortScoreStore();
  const item = newCohortScore("code-2", "title-858");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
