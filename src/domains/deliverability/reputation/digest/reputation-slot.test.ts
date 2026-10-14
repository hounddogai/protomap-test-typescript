import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationSlot } from "./reputation-slot.js";

test("ReputationSlot starts in created", () => {
  const item = newReputationSlot("code-750", "title-173");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationSlot moves to validated", () => {
  const item = newReputationSlot("code-750", "title-173");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ReputationSlot rejects moves from retired", () => {
  const item = newReputationSlot("code-750", "title-173");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
