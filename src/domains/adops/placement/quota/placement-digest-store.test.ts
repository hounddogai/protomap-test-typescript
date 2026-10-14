import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementDigestStore } from "./placement-digest-store.js";
import { newPlacementDigest } from "./placement-digest.js";

test("MemoryPlacementDigestStore finds what it saved", () => {
  const store = newMemoryPlacementDigestStore();
  const item = newPlacementDigest("code-583", "name-220");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
