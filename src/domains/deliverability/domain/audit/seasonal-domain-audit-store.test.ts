import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalDomainAuditStore } from "./seasonal-domain-audit-store.js";
import { newSeasonalDomainAudit } from "./seasonal-domain-audit.js";

test("MemorySeasonalDomainAuditStore finds what it saved", () => {
  const store = newMemorySeasonalDomainAuditStore();
  const item = newSeasonalDomainAudit("code-258", "title-312");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
