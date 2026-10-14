import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintSlot } from "./complaint-slot.js";

test("ComplaintSlot starts in requested", () => {
  const item = newComplaintSlot("code-923", "title-968");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintSlot moves to granted", () => {
  const item = newComplaintSlot("code-923", "title-968");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ComplaintSlot rejects moves from expired", () => {
  const item = newComplaintSlot("code-923", "title-968");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
