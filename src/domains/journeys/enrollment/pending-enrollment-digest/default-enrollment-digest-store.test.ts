import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultEnrollmentDigestStore } from "./default-enrollment-digest-store.js";
import { newDefaultEnrollmentDigest } from "./default-enrollment-digest.js";

test("MemoryDefaultEnrollmentDigestStore finds what it saved", () => {
  const store = newMemoryDefaultEnrollmentDigestStore();
  const item = newDefaultEnrollmentDigest("code-77", "title-523");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
