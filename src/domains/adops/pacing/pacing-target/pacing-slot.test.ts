import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingSlot } from "./pacing-slot.js";

test("PacingSlot starts in open", () => {
  const item = newPacingSlot("code-903", "label-233");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingSlot moves to reopened", () => {
  const item = newPacingSlot("code-903", "label-233");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PacingSlot rejects moves from archived", () => {
  const item = newPacingSlot("code-903", "label-233");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
