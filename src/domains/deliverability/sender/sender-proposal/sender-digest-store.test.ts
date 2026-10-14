import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderDigestStore } from "./sender-digest-store.js";
import { newSenderDigest } from "./sender-digest.js";

test("MemorySenderDigestStore finds what it saved", () => {
  const store = newMemorySenderDigestStore();
  const item = newSenderDigest("code-72", "title-269");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
