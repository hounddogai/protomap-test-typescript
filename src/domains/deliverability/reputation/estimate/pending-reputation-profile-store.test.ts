import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingReputationProfileStore } from "./pending-reputation-profile-store.js";
import { newPendingReputationProfile } from "./pending-reputation-profile.js";

test("MemoryPendingReputationProfileStore finds what it saved", () => {
  const store = newMemoryPendingReputationProfileStore();
  const item = newPendingReputationProfile("code-797", "title-713");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
