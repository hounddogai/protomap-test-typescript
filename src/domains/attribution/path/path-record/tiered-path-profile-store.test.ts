import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPathProfileStore } from "./tiered-path-profile-store.js";
import { newTieredPathProfile } from "./tiered-path-profile.js";

test("MemoryTieredPathProfileStore finds what it saved", () => {
  const store = newMemoryTieredPathProfileStore();
  const item = newTieredPathProfile("code-773", "label-899");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
