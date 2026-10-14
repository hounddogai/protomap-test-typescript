import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledActivationDigestStore } from "./scheduled-activation-digest-store.js";
import { newScheduledActivationDigest } from "./scheduled-activation-digest.js";

test("MemoryScheduledActivationDigestStore finds what it saved", () => {
  const store = newMemoryScheduledActivationDigestStore();
  const item = newScheduledActivationDigest("code-634", "name-428");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
