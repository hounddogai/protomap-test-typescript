import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyChallengeAuditStore } from "./legacy-challenge-audit-store.js";
import { newLegacyChallengeAudit } from "./legacy-challenge-audit.js";

test("MemoryLegacyChallengeAuditStore finds what it saved", () => {
  const store = newMemoryLegacyChallengeAuditStore();
  const item = newLegacyChallengeAudit("code-339", "title-482");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
