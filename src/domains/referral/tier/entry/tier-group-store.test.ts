import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierGroupStore } from "./tier-group-store.js";
import { newTierGroup } from "./tier-group.js";

test("MemoryTierGroupStore finds what it saved", () => {
  const store = newMemoryTierGroupStore();
  const item = newTierGroup("code-94", "title-660");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
