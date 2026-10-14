import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelDigestStore } from "./model-digest-store.js";
import { newModelDigest } from "./model-digest.js";

test("MemoryModelDigestStore finds what it saved", () => {
  const store = newMemoryModelDigestStore();
  const item = newModelDigest("code-753", "name-292");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
