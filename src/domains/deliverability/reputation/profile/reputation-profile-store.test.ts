import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationProfileStore } from "./reputation-profile-store.js";
import { newReputationProfile } from "./reputation-profile.js";

test("MemoryReputationProfileStore finds what it saved", () => {
  const store = newMemoryReputationProfileStore();
  const item = newReputationProfile("code-297", "label-507");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
