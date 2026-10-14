import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyAuditStore } from "./journey-audit-store.js";
import { newJourneyAudit } from "./journey-audit.js";

test("MemoryJourneyAuditStore finds what it saved", () => {
  const store = newMemoryJourneyAuditStore();
  const item = newJourneyAudit("code-959", "name-834");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
