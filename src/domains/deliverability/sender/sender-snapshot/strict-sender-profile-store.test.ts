import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSenderProfileStore } from "./strict-sender-profile-store.js";
import { newStrictSenderProfile } from "./strict-sender-profile.js";

test("MemoryStrictSenderProfileStore finds what it saved", () => {
  const store = newMemoryStrictSenderProfileStore();
  const item = newStrictSenderProfile("code-498", "title-45");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
