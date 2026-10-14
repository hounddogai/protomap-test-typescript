import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeEstimate } from "./nudge-estimate.js";

test("NudgeEstimate starts in created", () => {
  const item = newNudgeEstimate("code-244", "label-847");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeEstimate moves to validated", () => {
  const item = newNudgeEstimate("code-244", "label-847");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("NudgeEstimate rejects moves from retired", () => {
  const item = newNudgeEstimate("code-244", "label-847");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
