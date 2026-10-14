import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBadgeSlot } from "./capped-badge-slot.js";

test("CappedBadgeSlot starts in draft", () => {
  const item = newCappedBadgeSlot("code-567", "title-305");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBadgeSlot moves to suspended", () => {
  const item = newCappedBadgeSlot("code-567", "title-305");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("CappedBadgeSlot rejects moves from closed", () => {
  const item = newCappedBadgeSlot("code-567", "title-305");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
