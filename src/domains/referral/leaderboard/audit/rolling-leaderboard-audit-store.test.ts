import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingLeaderboardAuditStore } from "./rolling-leaderboard-audit-store.js";
import { newRollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

test("MemoryRollingLeaderboardAuditStore finds what it saved", () => {
  const store = newMemoryRollingLeaderboardAuditStore();
  const item = newRollingLeaderboardAudit("code-153", "label-127");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
