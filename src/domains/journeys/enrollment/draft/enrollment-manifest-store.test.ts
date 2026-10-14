import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentManifestStore } from "./enrollment-manifest-store.js";
import { newEnrollmentManifest } from "./enrollment-manifest.js";

test("MemoryEnrollmentManifestStore finds what it saved", () => {
  const store = newMemoryEnrollmentManifestStore();
  const item = newEnrollmentManifest("code-844", "name-5");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
