import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTouchpointTarget } from "./manual-touchpoint-target.js";

test("ManualTouchpointTarget starts in created", () => {
  const item = newManualTouchpointTarget("code-419", "label-802");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTouchpointTarget moves to validated", () => {
  const item = newManualTouchpointTarget("code-419", "label-802");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ManualTouchpointTarget rejects moves from retired", () => {
  const item = newManualTouchpointTarget("code-419", "label-802");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
