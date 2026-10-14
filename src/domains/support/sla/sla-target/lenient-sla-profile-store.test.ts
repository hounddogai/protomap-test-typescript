import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSlaProfileStore } from "./lenient-sla-profile-store.js";
import { newLenientSlaProfile } from "./lenient-sla-profile.js";

test("MemoryLenientSlaProfileStore finds what it saved", () => {
  const store = newMemoryLenientSlaProfileStore();
  const item = newLenientSlaProfile("code-210", "name-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
