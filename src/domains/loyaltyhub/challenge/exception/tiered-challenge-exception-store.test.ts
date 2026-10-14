import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredChallengeExceptionStore } from "./tiered-challenge-exception-store.js";
import { newTieredChallengeException } from "./tiered-challenge-exception.js";

test("MemoryTieredChallengeExceptionStore finds what it saved", () => {
  const store = newMemoryTieredChallengeExceptionStore();
  const item = newTieredChallengeException("code-955", "title-339");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
