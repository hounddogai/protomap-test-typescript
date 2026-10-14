import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteRollupStore } from "./invite-rollup-store.js";
import { newInviteRollup } from "./invite-rollup.js";

test("MemoryInviteRollupStore finds what it saved", () => {
  const store = newMemoryInviteRollupStore();
  const item = newInviteRollup("code-820", "label-843");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
