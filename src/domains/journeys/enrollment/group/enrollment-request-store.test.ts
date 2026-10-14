import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentRequestStore } from "./enrollment-request-store.js";
import { newEnrollmentRequest } from "./enrollment-request.js";

test("MemoryEnrollmentRequestStore finds what it saved", () => {
  const store = newMemoryEnrollmentRequestStore();
  const item = newEnrollmentRequest("code-826", "name-899");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
