import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalModelAuditStore } from "./regional-model-audit-store.js";
import { newRegionalModelAudit } from "./regional-model-audit.js";

test("MemoryRegionalModelAuditStore finds what it saved", () => {
  const store = newMemoryRegionalModelAuditStore();
  const item = newRegionalModelAudit("code-889", "title-634");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
