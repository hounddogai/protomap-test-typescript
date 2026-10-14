import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentExceptionStore } from "./enrollment-exception-store.js";
import { newEnrollmentException } from "./enrollment-exception.js";

test("MemoryEnrollmentExceptionStore finds what it saved", () => {
  const store = newMemoryEnrollmentExceptionStore();
  const item = newEnrollmentException("code-703", "label-895");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
