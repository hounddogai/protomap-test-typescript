import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteDigestStore } from "./invite-digest-store.js";
import { newInviteDigest } from "./invite-digest.js";

test("MemoryInviteDigestStore finds what it saved", () => {
  const store = newMemoryInviteDigestStore();
  const item = newInviteDigest("code-747", "title-222");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
