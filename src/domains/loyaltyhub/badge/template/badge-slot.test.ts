import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeSlot } from "./badge-slot.js";

test("BadgeSlot starts in new", () => {
  const item = newBadgeSlot("code-49", "label-44");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeSlot moves to running", () => {
  const item = newBadgeSlot("code-49", "label-44");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BadgeSlot rejects moves from failed", () => {
  const item = newBadgeSlot("code-49", "label-44");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
