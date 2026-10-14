import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationDigestStore } from "./activation-digest-store.js";
import { newActivationDigest } from "./activation-digest.js";

test("MemoryActivationDigestStore finds what it saved", () => {
  const store = newMemoryActivationDigestStore();
  const item = newActivationDigest("code-157", "title-940");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
