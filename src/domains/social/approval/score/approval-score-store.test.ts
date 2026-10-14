import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalScoreStore } from "./approval-score-store.js";
import { newApprovalScore } from "./approval-score.js";

test("MemoryApprovalScoreStore finds what it saved", () => {
  const store = newMemoryApprovalScoreStore();
  const item = newApprovalScore("code-6", "title-914");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
