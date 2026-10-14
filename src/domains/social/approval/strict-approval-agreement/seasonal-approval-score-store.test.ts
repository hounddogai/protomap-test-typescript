import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalApprovalScoreStore } from "./seasonal-approval-score-store.js";
import { newSeasonalApprovalScore } from "./seasonal-approval-score.js";

test("MemorySeasonalApprovalScoreStore finds what it saved", () => {
  const store = newMemorySeasonalApprovalScoreStore();
  const item = newSeasonalApprovalScore("code-812", "name-682");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
