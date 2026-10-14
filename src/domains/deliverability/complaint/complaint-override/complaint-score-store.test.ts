import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintScoreStore } from "./complaint-score-store.js";
import { newComplaintScore } from "./complaint-score.js";

test("MemoryComplaintScoreStore finds what it saved", () => {
  const store = newMemoryComplaintScoreStore();
  const item = newComplaintScore("code-172", "title-759");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
