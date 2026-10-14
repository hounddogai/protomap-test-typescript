import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultBadgeSlot } from "./default-badge-slot.js";

test("DefaultBadgeSlot starts in proposed", () => {
  const item = newDefaultBadgeSlot("code-894", "name-77");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultBadgeSlot moves to approved", () => {
  const item = newDefaultBadgeSlot("code-894", "name-77");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultBadgeSlot rejects moves from withdrawn", () => {
  const item = newDefaultBadgeSlot("code-894", "name-77");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
