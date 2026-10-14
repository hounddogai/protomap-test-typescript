import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredStepRecord } from "./tiered-step-record.js";

test("TieredStepRecord starts in requested", () => {
  const item = newTieredStepRecord("code-678", "label-299");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredStepRecord moves to granted", () => {
  const item = newTieredStepRecord("code-678", "label-299");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredStepRecord rejects moves from expired", () => {
  const item = newTieredStepRecord("code-678", "label-299");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
