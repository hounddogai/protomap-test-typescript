import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeManifestStore } from "./challenge-manifest-store.js";
import { newChallengeManifest } from "./challenge-manifest.js";

test("MemoryChallengeManifestStore finds what it saved", () => {
  const store = newMemoryChallengeManifestStore();
  const item = newChallengeManifest("code-426", "title-345");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
