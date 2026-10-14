import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualLeaderboardDraftStore } from "./manual-leaderboard-draft-store.js";
import { newManualLeaderboardDraft } from "./manual-leaderboard-draft.js";

test("MemoryManualLeaderboardDraftStore finds what it saved", () => {
  const store = newMemoryManualLeaderboardDraftStore();
  const item = newManualLeaderboardDraft("code-478", "title-721");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
