import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyProfileStore } from "./reply-profile-store.js";
import { newReplyProfile } from "./reply-profile.js";

test("MemoryReplyProfileStore finds what it saved", () => {
  const store = newMemoryReplyProfileStore();
  const item = newReplyProfile("code-32", "name-141");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
