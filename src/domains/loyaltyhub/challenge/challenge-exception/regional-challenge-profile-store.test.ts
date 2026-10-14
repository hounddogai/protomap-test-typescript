import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalChallengeProfileStore } from "./regional-challenge-profile-store.js";
import { newRegionalChallengeProfile } from "./regional-challenge-profile.js";

test("MemoryRegionalChallengeProfileStore finds what it saved", () => {
  const store = newMemoryRegionalChallengeProfileStore();
  const item = newRegionalChallengeProfile("code-538", "label-726");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
