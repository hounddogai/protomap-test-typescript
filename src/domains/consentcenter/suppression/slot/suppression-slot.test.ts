import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionSlot } from "./suppression-slot.js";

test("SuppressionSlot starts in proposed", () => {
  const item = newSuppressionSlot("code-913", "label-611");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionSlot moves to approved", () => {
  const item = newSuppressionSlot("code-913", "label-611");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SuppressionSlot rejects moves from withdrawn", () => {
  const item = newSuppressionSlot("code-913", "label-611");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
