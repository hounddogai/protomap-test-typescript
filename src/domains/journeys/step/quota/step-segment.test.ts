import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepSegment } from "./step-segment.js";

test("StepSegment starts in requested", () => {
  const item = newStepSegment("code-932", "label-472");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepSegment moves to revoked", () => {
  const item = newStepSegment("code-932", "label-472");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StepSegment rejects moves from expired", () => {
  const item = newStepSegment("code-932", "label-472");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
