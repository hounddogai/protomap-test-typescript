import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTouchpointBundle } from "./manual-touchpoint-bundle.js";

test("ManualTouchpointBundle starts in created", () => {
  const item = newManualTouchpointBundle("code-821", "label-510");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTouchpointBundle moves to validated", () => {
  const item = newManualTouchpointBundle("code-821", "label-510");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ManualTouchpointBundle rejects moves from retired", () => {
  const item = newManualTouchpointBundle("code-821", "label-510");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
