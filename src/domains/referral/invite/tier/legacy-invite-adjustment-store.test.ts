import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyInviteAdjustmentStore } from "./legacy-invite-adjustment-store.js";
import { newLegacyInviteAdjustment } from "./legacy-invite-adjustment.js";

test("MemoryLegacyInviteAdjustmentStore finds what it saved", () => {
  const store = newMemoryLegacyInviteAdjustmentStore();
  const item = newLegacyInviteAdjustment("code-588", "name-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
