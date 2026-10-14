import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPathDigestStore } from "./tiered-path-digest-store.js";
import { newTieredPathDigest } from "./tiered-path-digest.js";

test("MemoryTieredPathDigestStore finds what it saved", () => {
  const store = newMemoryTieredPathDigestStore();
  const item = newTieredPathDigest("code-167", "name-256");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
