import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyChallengeTargetStore } from "./legacy-challenge-target-store.js";
import { newLegacyChallengeTarget } from "./legacy-challenge-target.js";

test("MemoryLegacyChallengeTargetStore finds what it saved", () => {
  const store = newMemoryLegacyChallengeTargetStore();
  const item = newLegacyChallengeTarget("code-96", "title-508");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
