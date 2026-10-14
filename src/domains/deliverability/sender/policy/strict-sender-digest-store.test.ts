import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSenderDigestStore } from "./strict-sender-digest-store.js";
import { newStrictSenderDigest } from "./strict-sender-digest.js";

test("MemoryStrictSenderDigestStore finds what it saved", () => {
  const store = newMemoryStrictSenderDigestStore();
  const item = newStrictSenderDigest("code-412", "title-789");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
