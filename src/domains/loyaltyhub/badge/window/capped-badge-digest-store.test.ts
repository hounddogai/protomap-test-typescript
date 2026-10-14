import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBadgeDigestStore } from "./capped-badge-digest-store.js";
import { newCappedBadgeDigest } from "./capped-badge-digest.js";

test("MemoryCappedBadgeDigestStore finds what it saved", () => {
  const store = newMemoryCappedBadgeDigestStore();
  const item = newCappedBadgeDigest("code-142", "name-697");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
