import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBadgeDigestStore } from "./regional-badge-digest-store.js";
import { newRegionalBadgeDigest } from "./regional-badge-digest.js";

test("MemoryRegionalBadgeDigestStore finds what it saved", () => {
  const store = newMemoryRegionalBadgeDigestStore();
  const item = newRegionalBadgeDigest("code-20", "name-465");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
