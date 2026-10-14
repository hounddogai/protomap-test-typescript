import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveInviteAdjustmentStore } from "./adaptive-invite-adjustment-store.js";
import { newAdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

test("MemoryAdaptiveInviteAdjustmentStore finds what it saved", () => {
  const store = newMemoryAdaptiveInviteAdjustmentStore();
  const item = newAdaptiveInviteAdjustment("code-950", "name-651");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
