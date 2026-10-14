import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentBundleStore } from "./enrollment-bundle-store.js";
import { newEnrollmentBundle } from "./enrollment-bundle.js";

test("MemoryEnrollmentBundleStore finds what it saved", () => {
  const store = newMemoryEnrollmentBundleStore();
  const item = newEnrollmentBundle("code-795", "title-22");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
