import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDoubleOptInProfileStore } from "./tiered-double-opt-in-profile-store.js";
import { newTieredDoubleOptInProfile } from "./tiered-double-opt-in-profile.js";

test("MemoryTieredDoubleOptInProfileStore finds what it saved", () => {
  const store = newMemoryTieredDoubleOptInProfileStore();
  const item = newTieredDoubleOptInProfile("code-913", "label-669");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
