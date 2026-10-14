import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutScoreStore } from "./opt-out-score-store.js";
import { newOptOutScore } from "./opt-out-score.js";

test("MemoryOptOutScoreStore finds what it saved", () => {
  const store = newMemoryOptOutScoreStore();
  const item = newOptOutScore("code-237", "name-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
