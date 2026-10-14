import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualEnrollmentSnapshotStore } from "./manual-enrollment-snapshot-store.js";
import { newManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

test("MemoryManualEnrollmentSnapshotStore finds what it saved", () => {
  const store = newMemoryManualEnrollmentSnapshotStore();
  const item = newManualEnrollmentSnapshot("code-694", "label-284");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
