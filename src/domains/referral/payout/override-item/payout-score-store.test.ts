import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutScoreStore } from "./payout-score-store.js";
import { newPayoutScore } from "./payout-score.js";

test("MemoryPayoutScoreStore finds what it saved", () => {
  const store = newMemoryPayoutScoreStore();
  const item = newPayoutScore("code-114", "title-107");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
