import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRewardProfileStore } from "./lenient-reward-profile-store.js";
import { newLenientRewardProfile } from "./lenient-reward-profile.js";

test("MemoryLenientRewardProfileStore finds what it saved", () => {
  const store = newMemoryLenientRewardProfileStore();
  const item = newLenientRewardProfile("code-969", "label-275");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
