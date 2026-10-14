import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeVariance } from "./nudge-variance.js";

test("NudgeVariance starts in planned", () => {
  const item = newNudgeVariance("code-459", "name-456");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeVariance moves to completed", () => {
  const item = newNudgeVariance("code-459", "name-456");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("NudgeVariance rejects moves from cancelled", () => {
  const item = newNudgeVariance("code-459", "name-456");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
