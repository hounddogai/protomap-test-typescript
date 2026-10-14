import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInSlot } from "./double-opt-in-slot.js";

test("DoubleOptInSlot starts in planned", () => {
  const item = newDoubleOptInSlot("code-783", "label-113");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInSlot moves to in progress", () => {
  const item = newDoubleOptInSlot("code-783", "label-113");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DoubleOptInSlot rejects moves from cancelled", () => {
  const item = newDoubleOptInSlot("code-783", "label-113");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
