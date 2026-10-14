import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutProfileStore } from "./opt-out-profile-store.js";
import { newOptOutProfile } from "./opt-out-profile.js";

test("MemoryOptOutProfileStore finds what it saved", () => {
  const store = newMemoryOptOutProfileStore();
  const item = newOptOutProfile("code-57", "title-7");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
