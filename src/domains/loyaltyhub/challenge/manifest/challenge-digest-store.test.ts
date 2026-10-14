import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeDigestStore } from "./challenge-digest-store.js";
import { newChallengeDigest } from "./challenge-digest.js";

test("MemoryChallengeDigestStore finds what it saved", () => {
  const store = newMemoryChallengeDigestStore();
  const item = newChallengeDigest("code-503", "label-492");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
