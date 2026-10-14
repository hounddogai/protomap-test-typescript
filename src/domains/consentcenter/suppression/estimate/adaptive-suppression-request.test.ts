import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

test("AdaptiveSuppressionRequest starts in requested", () => {
  const item = newAdaptiveSuppressionRequest("code-365", "title-401");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSuppressionRequest moves to granted", () => {
  const item = newAdaptiveSuppressionRequest("code-365", "title-401");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptiveSuppressionRequest rejects moves from expired", () => {
  const item = newAdaptiveSuppressionRequest("code-365", "title-401");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
