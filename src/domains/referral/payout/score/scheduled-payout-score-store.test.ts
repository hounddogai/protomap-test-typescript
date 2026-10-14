import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPayoutScoreStore } from "./scheduled-payout-score-store.js";
import { newScheduledPayoutScore } from "./scheduled-payout-score.js";

test("MemoryScheduledPayoutScoreStore finds what it saved", () => {
  const store = newMemoryScheduledPayoutScoreStore();
  const item = newScheduledPayoutScore("code-812", "name-491");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
