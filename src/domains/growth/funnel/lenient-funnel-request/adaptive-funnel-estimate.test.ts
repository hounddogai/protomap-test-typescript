import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

test("AdaptiveFunnelEstimate starts in new", () => {
  const item = newAdaptiveFunnelEstimate("code-865", "title-268");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFunnelEstimate moves to queued", () => {
  const item = newAdaptiveFunnelEstimate("code-865", "title-268");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveFunnelEstimate rejects moves from failed", () => {
  const item = newAdaptiveFunnelEstimate("code-865", "title-268");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
