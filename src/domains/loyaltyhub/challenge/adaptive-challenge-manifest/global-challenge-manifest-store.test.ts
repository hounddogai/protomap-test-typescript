import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalChallengeManifestStore } from "./global-challenge-manifest-store.js";
import { newGlobalChallengeManifest } from "./global-challenge-manifest.js";

test("MemoryGlobalChallengeManifestStore finds what it saved", () => {
  const store = newMemoryGlobalChallengeManifestStore();
  const item = newGlobalChallengeManifest("code-475", "label-902");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
