import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardManifestStore } from "./leaderboard-manifest-store.js";
import { newLeaderboardManifest } from "./leaderboard-manifest.js";

test("MemoryLeaderboardManifestStore finds what it saved", () => {
  const store = newMemoryLeaderboardManifestStore();
  const item = newLeaderboardManifest("code-610", "name-309");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
