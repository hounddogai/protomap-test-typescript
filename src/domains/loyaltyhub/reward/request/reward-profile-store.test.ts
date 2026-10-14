import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardProfileStore } from "./reward-profile-store.js";
import { newRewardProfile } from "./reward-profile.js";

test("MemoryRewardProfileStore finds what it saved", () => {
  const store = newMemoryRewardProfileStore();
  const item = newRewardProfile("code-568", "label-303");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
