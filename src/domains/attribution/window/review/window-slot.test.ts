import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowSlot } from "./window-slot.js";

test("WindowSlot starts in open", () => {
  const item = newWindowSlot("code-711", "name-542");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowSlot moves to in review", () => {
  const item = newWindowSlot("code-711", "name-542");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WindowSlot rejects moves from archived", () => {
  const item = newWindowSlot("code-711", "name-542");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
