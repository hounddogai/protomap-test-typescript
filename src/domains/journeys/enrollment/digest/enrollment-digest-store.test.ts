import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentDigestStore } from "./enrollment-digest-store.js";
import { newEnrollmentDigest } from "./enrollment-digest.js";

test("MemoryEnrollmentDigestStore finds what it saved", () => {
  const store = newMemoryEnrollmentDigestStore();
  const item = newEnrollmentDigest("code-934", "label-571");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
