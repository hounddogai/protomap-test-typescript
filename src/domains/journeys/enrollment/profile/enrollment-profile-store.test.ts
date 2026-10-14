import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentProfileStore } from "./enrollment-profile-store.js";
import { newEnrollmentProfile } from "./enrollment-profile.js";

test("MemoryEnrollmentProfileStore finds what it saved", () => {
  const store = newMemoryEnrollmentProfileStore();
  const item = newEnrollmentProfile("code-662", "name-397");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
