import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteMappingStore } from "./invite-mapping-store.js";
import { newInviteMapping } from "./invite-mapping.js";

test("MemoryInviteMappingStore finds what it saved", () => {
  const store = newMemoryInviteMappingStore();
  const item = newInviteMapping("code-585", "name-855");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
