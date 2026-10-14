import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedEnrollmentRequestStore } from "./capped-enrollment-request-store.js";
import { newCappedEnrollmentRequest } from "./capped-enrollment-request.js";

test("MemoryCappedEnrollmentRequestStore finds what it saved", () => {
  const store = newMemoryCappedEnrollmentRequestStore();
  const item = newCappedEnrollmentRequest("code-572", "title-498");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
