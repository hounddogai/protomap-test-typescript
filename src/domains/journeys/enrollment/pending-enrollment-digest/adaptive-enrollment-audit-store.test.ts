import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveEnrollmentAuditStore } from "./adaptive-enrollment-audit-store.js";
import { newAdaptiveEnrollmentAudit } from "./adaptive-enrollment-audit.js";

test("MemoryAdaptiveEnrollmentAuditStore finds what it saved", () => {
  const store = newMemoryAdaptiveEnrollmentAuditStore();
  const item = newAdaptiveEnrollmentAudit("code-764", "name-451");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
