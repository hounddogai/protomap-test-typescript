import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFunnelAgreement } from "./fallback-funnel-agreement.js";

test("FallbackFunnelAgreement starts in new", () => {
  const item = newFallbackFunnelAgreement("code-631", "label-783");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFunnelAgreement moves to running", () => {
  const item = newFallbackFunnelAgreement("code-631", "label-783");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("FallbackFunnelAgreement rejects moves from failed", () => {
  const item = newFallbackFunnelAgreement("code-631", "label-783");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
