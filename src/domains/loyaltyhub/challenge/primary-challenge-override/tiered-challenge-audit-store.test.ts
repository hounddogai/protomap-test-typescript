import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredChallengeAuditStore } from "./tiered-challenge-audit-store.js";
import { newTieredChallengeAudit } from "./tiered-challenge-audit.js";

test("MemoryTieredChallengeAuditStore finds what it saved", () => {
  const store = newMemoryTieredChallengeAuditStore();
  const item = newTieredChallengeAudit("code-596", "label-468");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
