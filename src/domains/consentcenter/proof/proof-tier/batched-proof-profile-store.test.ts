import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedProofProfileStore } from "./batched-proof-profile-store.js";
import { newBatchedProofProfile } from "./batched-proof-profile.js";

test("MemoryBatchedProofProfileStore finds what it saved", () => {
  const store = newMemoryBatchedProofProfileStore();
  const item = newBatchedProofProfile("code-486", "label-731");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
