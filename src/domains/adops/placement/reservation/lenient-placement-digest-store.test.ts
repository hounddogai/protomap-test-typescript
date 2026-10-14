import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPlacementDigestStore } from "./lenient-placement-digest-store.js";
import { newLenientPlacementDigest } from "./lenient-placement-digest.js";

test("MemoryLenientPlacementDigestStore finds what it saved", () => {
  const store = newMemoryLenientPlacementDigestStore();
  const item = newLenientPlacementDigest("code-82", "label-639");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
