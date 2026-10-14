import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardNoticeStore } from "./leaderboard-notice-store.js";
import { newLeaderboardNotice } from "./leaderboard-notice.js";

test("MemoryLeaderboardNoticeStore finds what it saved", () => {
  const store = newMemoryLeaderboardNoticeStore();
  const item = newLeaderboardNotice("code-975", "label-842");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
