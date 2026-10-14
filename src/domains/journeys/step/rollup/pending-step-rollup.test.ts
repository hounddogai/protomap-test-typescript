import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingStepRollup } from "./pending-step-rollup.js";

test("PendingStepRollup starts in open", () => {
  const item = newPendingStepRollup("code-223", "label-972");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingStepRollup moves to reopened", () => {
  const item = newPendingStepRollup("code-223", "label-972");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PendingStepRollup rejects moves from archived", () => {
  const item = newPendingStepRollup("code-223", "label-972");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
