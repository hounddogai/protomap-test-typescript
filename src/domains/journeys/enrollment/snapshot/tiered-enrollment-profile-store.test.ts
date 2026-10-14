import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredEnrollmentProfileStore } from "./tiered-enrollment-profile-store.js";
import { newTieredEnrollmentProfile } from "./tiered-enrollment-profile.js";

test("MemoryTieredEnrollmentProfileStore finds what it saved", () => {
  const store = newMemoryTieredEnrollmentProfileStore();
  const item = newTieredEnrollmentProfile("code-664", "label-583");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
