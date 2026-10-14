import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalLevelAuditStore } from "./seasonal-level-audit-store.js";
import { newSeasonalLevelAudit } from "./seasonal-level-audit.js";

test("MemorySeasonalLevelAuditStore finds what it saved", () => {
  const store = newMemorySeasonalLevelAuditStore();
  const item = newSeasonalLevelAudit("code-504", "name-618");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
