import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalModelAuditStore } from "./seasonal-model-audit-store.js";
import { newSeasonalModelAudit } from "./seasonal-model-audit.js";

test("MemorySeasonalModelAuditStore finds what it saved", () => {
  const store = newMemorySeasonalModelAuditStore();
  const item = newSeasonalModelAudit("code-815", "label-662");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
