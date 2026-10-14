import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardAuditStore } from "./leaderboard-audit-store.js";
import { newLeaderboardAudit } from "./leaderboard-audit.js";

test("MemoryLeaderboardAuditStore finds what it saved", () => {
  const store = newMemoryLeaderboardAuditStore();
  const item = newLeaderboardAudit("code-470", "title-440");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
