import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedLeaderboardNoticeStore } from "./capped-leaderboard-notice-store.js";
import { newCappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

test("MemoryCappedLeaderboardNoticeStore finds what it saved", () => {
  const store = newMemoryCappedLeaderboardNoticeStore();
  const item = newCappedLeaderboardNotice("code-448", "label-446");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
