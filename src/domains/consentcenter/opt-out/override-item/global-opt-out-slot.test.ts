import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalOptOutSlot } from "./global-opt-out-slot.js";

test("GlobalOptOutSlot starts in draft", () => {
  const item = newGlobalOptOutSlot("code-241", "name-808");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalOptOutSlot moves to pending", () => {
  const item = newGlobalOptOutSlot("code-241", "name-808");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("GlobalOptOutSlot rejects moves from closed", () => {
  const item = newGlobalOptOutSlot("code-241", "name-808");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
