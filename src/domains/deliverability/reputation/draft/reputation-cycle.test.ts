import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationCycle } from "./reputation-cycle.js";

test("ReputationCycle starts in planned", () => {
  const item = newReputationCycle("code-37", "title-724");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationCycle moves to in progress", () => {
  const item = newReputationCycle("code-37", "title-724");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ReputationCycle rejects moves from cancelled", () => {
  const item = newReputationCycle("code-37", "title-724");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
