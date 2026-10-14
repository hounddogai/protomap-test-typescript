import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedWaitDigestStore } from "./capped-wait-digest-store.js";
import { newCappedWaitDigest } from "./capped-wait-digest.js";

test("MemoryCappedWaitDigestStore finds what it saved", () => {
  const store = newMemoryCappedWaitDigestStore();
  const item = newCappedWaitDigest("code-856", "title-824");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
