import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFunnelAgreement } from "./adaptive-funnel-agreement.js";

test("AdaptiveFunnelAgreement starts in idle", () => {
  const item = newAdaptiveFunnelAgreement("code-77", "label-172");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFunnelAgreement moves to ready", () => {
  const item = newAdaptiveFunnelAgreement("code-77", "label-172");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("AdaptiveFunnelAgreement rejects moves from stopped", () => {
  const item = newAdaptiveFunnelAgreement("code-77", "label-172");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
