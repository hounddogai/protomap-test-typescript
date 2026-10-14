import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCsatAuditStore } from "./seasonal-csat-audit-store.js";
import { newSeasonalCsatAudit } from "./seasonal-csat-audit.js";

test("MemorySeasonalCsatAuditStore finds what it saved", () => {
  const store = newMemorySeasonalCsatAuditStore();
  const item = newSeasonalCsatAudit("code-598", "label-894");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
