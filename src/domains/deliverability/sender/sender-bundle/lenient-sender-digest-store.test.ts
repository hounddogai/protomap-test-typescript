import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSenderDigestStore } from "./lenient-sender-digest-store.js";
import { newLenientSenderDigest } from "./lenient-sender-digest.js";

test("MemoryLenientSenderDigestStore finds what it saved", () => {
  const store = newMemoryLenientSenderDigestStore();
  const item = newLenientSenderDigest("code-311", "name-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
