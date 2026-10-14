import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientOptOutScoreStore } from "./lenient-opt-out-score-store.js";
import { newLenientOptOutScore } from "./lenient-opt-out-score.js";

test("MemoryLenientOptOutScoreStore finds what it saved", () => {
  const store = newMemoryLenientOptOutScoreStore();
  const item = newLenientOptOutScore("code-757", "label-814");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
