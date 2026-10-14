import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentTierStore } from "./enrollment-tier-store.js";
import { newEnrollmentTier } from "./enrollment-tier.js";

test("MemoryEnrollmentTierStore finds what it saved", () => {
  const store = newMemoryEnrollmentTierStore();
  const item = newEnrollmentTier("code-261", "title-87");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
