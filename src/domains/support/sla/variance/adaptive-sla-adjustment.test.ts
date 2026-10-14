import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSlaAdjustment } from "./adaptive-sla-adjustment.js";

test("AdaptiveSlaAdjustment starts in created", () => {
  const item = newAdaptiveSlaAdjustment("code-330", "label-504");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSlaAdjustment moves to validated", () => {
  const item = newAdaptiveSlaAdjustment("code-330", "label-504");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptiveSlaAdjustment rejects moves from retired", () => {
  const item = newAdaptiveSlaAdjustment("code-330", "label-504");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
