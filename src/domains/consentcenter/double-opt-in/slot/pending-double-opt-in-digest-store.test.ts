import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingDoubleOptInDigestStore } from "./pending-double-opt-in-digest-store.js";
import { newPendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

test("MemoryPendingDoubleOptInDigestStore finds what it saved", () => {
  const store = newMemoryPendingDoubleOptInDigestStore();
  const item = newPendingDoubleOptInDigest("code-600", "label-103");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
