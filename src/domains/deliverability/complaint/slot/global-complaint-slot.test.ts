import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalComplaintSlot } from "./global-complaint-slot.js";

test("GlobalComplaintSlot starts in planned", () => {
  const item = newGlobalComplaintSlot("code-971", "name-362");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalComplaintSlot moves to completed", () => {
  const item = newGlobalComplaintSlot("code-971", "name-362");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("GlobalComplaintSlot rejects moves from cancelled", () => {
  const item = newGlobalComplaintSlot("code-971", "name-362");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
