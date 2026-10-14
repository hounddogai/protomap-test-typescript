import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeManifestStore } from "./badge-manifest-store.js";
import { newBadgeManifest } from "./badge-manifest.js";

test("MemoryBadgeManifestStore finds what it saved", () => {
  const store = newMemoryBadgeManifestStore();
  const item = newBadgeManifest("code-331", "name-630");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
