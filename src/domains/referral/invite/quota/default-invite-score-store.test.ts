import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultInviteScoreStore } from "./default-invite-score-store.js";
import { newDefaultInviteScore } from "./default-invite-score.js";

test("MemoryDefaultInviteScoreStore finds what it saved", () => {
  const store = newMemoryDefaultInviteScoreStore();
  const item = newDefaultInviteScore("code-956", "title-876");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
