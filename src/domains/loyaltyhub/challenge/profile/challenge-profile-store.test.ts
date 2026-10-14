import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeProfileStore } from "./challenge-profile-store.js";
import { newChallengeProfile } from "./challenge-profile.js";

test("MemoryChallengeProfileStore finds what it saved", () => {
  const store = newMemoryChallengeProfileStore();
  const item = newChallengeProfile("code-570", "title-52");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
