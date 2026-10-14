import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeTierStore } from "./challenge-tier-store.js";
import { newChallengeTier } from "./challenge-tier.js";

test("MemoryChallengeTierStore finds what it saved", () => {
  const store = newMemoryChallengeTierStore();
  const item = newChallengeTier("code-976", "label-897");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
