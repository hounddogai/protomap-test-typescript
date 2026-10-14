import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeTargetStore } from "./challenge-target-store.js";
import { newChallengeTarget } from "./challenge-target.js";

test("MemoryChallengeTargetStore finds what it saved", () => {
  const store = newMemoryChallengeTargetStore();
  const item = newChallengeTarget("code-713", "name-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
