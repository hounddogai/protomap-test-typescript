import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointEstimate } from "./touchpoint-estimate.js";

test("TouchpointEstimate starts in created", () => {
  const item = newTouchpointEstimate("code-72", "label-682");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointEstimate moves to validated", () => {
  const item = newTouchpointEstimate("code-72", "label-682");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TouchpointEstimate rejects moves from retired", () => {
  const item = newTouchpointEstimate("code-72", "label-682");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
