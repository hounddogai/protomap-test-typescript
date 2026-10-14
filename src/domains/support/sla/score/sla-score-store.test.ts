import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaScoreStore } from "./sla-score-store.js";
import { newSlaScore } from "./sla-score.js";

test("MemorySlaScoreStore finds what it saved", () => {
  const store = newMemorySlaScoreStore();
  const item = newSlaScore("code-558", "title-226");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
