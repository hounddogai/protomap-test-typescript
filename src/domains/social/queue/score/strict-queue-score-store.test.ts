import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictQueueScoreStore } from "./strict-queue-score-store.js";
import { newStrictQueueScore } from "./strict-queue-score.js";

test("MemoryStrictQueueScoreStore finds what it saved", () => {
  const store = newMemoryStrictQueueScoreStore();
  const item = newStrictQueueScore("code-21", "name-68");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
