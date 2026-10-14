import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFraudCheckTemplate } from "./strict-fraud-check-template.js";

test("StrictFraudCheckTemplate starts in new", () => {
  const item = newStrictFraudCheckTemplate("code-162", "title-913");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFraudCheckTemplate moves to running", () => {
  const item = newStrictFraudCheckTemplate("code-162", "title-913");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictFraudCheckTemplate rejects moves from failed", () => {
  const item = newStrictFraudCheckTemplate("code-162", "title-913");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
