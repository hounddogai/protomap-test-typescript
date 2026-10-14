import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryChallengeManifestStore } from "./primary-challenge-manifest-store.js";
import { newPrimaryChallengeManifest } from "./primary-challenge-manifest.js";

test("MemoryPrimaryChallengeManifestStore finds what it saved", () => {
  const store = newMemoryPrimaryChallengeManifestStore();
  const item = newPrimaryChallengeManifest("code-632", "name-856");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
