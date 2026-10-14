import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictEnrollmentDigestStore } from "./strict-enrollment-digest-store.js";
import { newStrictEnrollmentDigest } from "./strict-enrollment-digest.js";

test("MemoryStrictEnrollmentDigestStore finds what it saved", () => {
  const store = newMemoryStrictEnrollmentDigestStore();
  const item = newStrictEnrollmentDigest("code-11", "title-615");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
