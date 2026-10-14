import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyBadgeManifestStore } from "./legacy-badge-manifest-store.js";
import { newLegacyBadgeManifest } from "./legacy-badge-manifest.js";

test("MemoryLegacyBadgeManifestStore finds what it saved", () => {
  const store = newMemoryLegacyBadgeManifestStore();
  const item = newLegacyBadgeManifest("code-117", "title-224");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
