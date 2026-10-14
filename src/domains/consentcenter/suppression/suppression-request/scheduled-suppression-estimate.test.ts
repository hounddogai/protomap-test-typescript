import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSuppressionEstimate } from "./scheduled-suppression-estimate.js";

test("ScheduledSuppressionEstimate starts in requested", () => {
  const item = newScheduledSuppressionEstimate("code-360", "name-235");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSuppressionEstimate moves to expired", () => {
  const item = newScheduledSuppressionEstimate("code-360", "name-235");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledSuppressionEstimate rejects moves from expired", () => {
  const item = newScheduledSuppressionEstimate("code-360", "name-235");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
