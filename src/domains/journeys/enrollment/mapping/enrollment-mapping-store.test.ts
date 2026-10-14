import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentMappingStore } from "./enrollment-mapping-store.js";
import { newEnrollmentMapping } from "./enrollment-mapping.js";

test("MemoryEnrollmentMappingStore finds what it saved", () => {
  const store = newMemoryEnrollmentMappingStore();
  const item = newEnrollmentMapping("code-221", "title-213");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
