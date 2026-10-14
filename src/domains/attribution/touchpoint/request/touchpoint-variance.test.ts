import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointVariance } from "./touchpoint-variance.js";

test("TouchpointVariance starts in created", () => {
  const item = newTouchpointVariance("code-635", "label-630");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointVariance moves to validated", () => {
  const item = newTouchpointVariance("code-635", "label-630");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TouchpointVariance rejects moves from retired", () => {
  const item = newTouchpointVariance("code-635", "label-630");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
