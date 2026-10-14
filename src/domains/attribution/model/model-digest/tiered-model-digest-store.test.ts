import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredModelDigestStore } from "./tiered-model-digest-store.js";
import { newTieredModelDigest } from "./tiered-model-digest.js";

test("MemoryTieredModelDigestStore finds what it saved", () => {
  const store = newMemoryTieredModelDigestStore();
  const item = newTieredModelDigest("code-162", "label-38");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
