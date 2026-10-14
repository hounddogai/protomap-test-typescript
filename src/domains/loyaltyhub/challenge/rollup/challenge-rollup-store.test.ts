import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeRollupStore } from "./challenge-rollup-store.js";
import { newChallengeRollup } from "./challenge-rollup.js";

test("MemoryChallengeRollupStore finds what it saved", () => {
  const store = newMemoryChallengeRollupStore();
  const item = newChallengeRollup("code-121", "name-509");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
