import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaProfileStore } from "./sla-profile-store.js";
import { newSlaProfile } from "./sla-profile.js";

test("MemorySlaProfileStore finds what it saved", () => {
  const store = newMemorySlaProfileStore();
  const item = newSlaProfile("code-53", "name-878");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
