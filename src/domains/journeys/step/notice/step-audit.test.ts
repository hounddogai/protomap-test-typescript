import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepAudit } from "./step-audit.js";

test("StepAudit starts in requested", () => {
  const item = newStepAudit("code-986", "title-988");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepAudit moves to granted", () => {
  const item = newStepAudit("code-986", "title-988");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StepAudit rejects moves from expired", () => {
  const item = newStepAudit("code-986", "title-988");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
