import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveModelAdjustment } from "./adaptive-model-adjustment.js";

test("AdaptiveModelAdjustment starts in requested", () => {
  const item = newAdaptiveModelAdjustment("code-660", "title-96");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveModelAdjustment moves to expired", () => {
  const item = newAdaptiveModelAdjustment("code-660", "title-96");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("AdaptiveModelAdjustment rejects moves from expired", () => {
  const item = newAdaptiveModelAdjustment("code-660", "title-96");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
