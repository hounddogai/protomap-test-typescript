import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionRequest } from "./suppression-request.js";

test("SuppressionRequest starts in created", () => {
  const item = newSuppressionRequest("code-188", "label-440");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionRequest moves to validated", () => {
  const item = newSuppressionRequest("code-188", "label-440");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SuppressionRequest rejects moves from retired", () => {
  const item = newSuppressionRequest("code-188", "label-440");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
