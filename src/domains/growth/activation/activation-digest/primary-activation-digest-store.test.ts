import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryActivationDigestStore } from "./primary-activation-digest-store.js";
import { newPrimaryActivationDigest } from "./primary-activation-digest.js";

test("MemoryPrimaryActivationDigestStore finds what it saved", () => {
  const store = newMemoryPrimaryActivationDigestStore();
  const item = newPrimaryActivationDigest("code-3", "title-989");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
