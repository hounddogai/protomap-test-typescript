import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalEnrollmentSnapshotStore } from "./regional-enrollment-snapshot-store.js";
import { newRegionalEnrollmentSnapshot } from "./regional-enrollment-snapshot.js";

test("MemoryRegionalEnrollmentSnapshotStore finds what it saved", () => {
  const store = newMemoryRegionalEnrollmentSnapshotStore();
  const item = newRegionalEnrollmentSnapshot("code-384", "title-321");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
