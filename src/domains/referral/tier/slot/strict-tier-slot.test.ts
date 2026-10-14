import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTierSlot } from "./strict-tier-slot.js";

test("StrictTierSlot starts in created", () => {
  const item = newStrictTierSlot("code-659", "label-161");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTierSlot moves to validated", () => {
  const item = newStrictTierSlot("code-659", "label-161");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictTierSlot rejects moves from retired", () => {
  const item = newStrictTierSlot("code-659", "label-161");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
