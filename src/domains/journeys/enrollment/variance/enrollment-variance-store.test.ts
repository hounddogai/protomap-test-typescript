import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentVarianceStore } from "./enrollment-variance-store.js";
import { newEnrollmentVariance } from "./enrollment-variance.js";

test("MemoryEnrollmentVarianceStore finds what it saved", () => {
  const store = newMemoryEnrollmentVarianceStore();
  const item = newEnrollmentVariance("code-137", "name-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
