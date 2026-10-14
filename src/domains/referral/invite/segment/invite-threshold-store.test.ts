import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteThresholdStore } from "./invite-threshold-store.js";
import { newInviteThreshold } from "./invite-threshold.js";

test("MemoryInviteThresholdStore finds what it saved", () => {
  const store = newMemoryInviteThresholdStore();
  const item = newInviteThreshold("code-555", "title-439");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
