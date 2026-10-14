import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualOptOutProfileStore } from "./manual-opt-out-profile-store.js";
import { newManualOptOutProfile } from "./manual-opt-out-profile.js";

test("MemoryManualOptOutProfileStore finds what it saved", () => {
  const store = newMemoryManualOptOutProfileStore();
  const item = newManualOptOutProfile("code-302", "name-104");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
