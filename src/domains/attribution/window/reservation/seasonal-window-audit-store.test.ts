import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWindowAuditStore } from "./seasonal-window-audit-store.js";
import { newSeasonalWindowAudit } from "./seasonal-window-audit.js";

test("MemorySeasonalWindowAuditStore finds what it saved", () => {
  const store = newMemorySeasonalWindowAuditStore();
  const item = newSeasonalWindowAudit("code-444", "name-276");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
