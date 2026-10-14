import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBadgeManifestStore } from "./regional-badge-manifest-store.js";
import { newRegionalBadgeManifest } from "./regional-badge-manifest.js";

test("MemoryRegionalBadgeManifestStore finds what it saved", () => {
  const store = newMemoryRegionalBadgeManifestStore();
  const item = newRegionalBadgeManifest("code-28", "name-971");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
