import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentRollupStore } from "./enrollment-rollup-store.js";
import { newEnrollmentRollup } from "./enrollment-rollup.js";

test("MemoryEnrollmentRollupStore finds what it saved", () => {
  const store = newMemoryEnrollmentRollupStore();
  const item = newEnrollmentRollup("code-524", "title-998");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
