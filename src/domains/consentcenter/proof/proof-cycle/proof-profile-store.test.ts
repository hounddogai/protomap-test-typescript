import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofProfileStore } from "./proof-profile-store.js";
import { newProofProfile } from "./proof-profile.js";

test("MemoryProofProfileStore finds what it saved", () => {
  const store = newMemoryProofProfileStore();
  const item = newProofProfile("code-669", "label-53");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
