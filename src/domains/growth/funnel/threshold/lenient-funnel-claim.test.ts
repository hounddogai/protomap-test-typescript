import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFunnelClaim } from "./lenient-funnel-claim.js";

test("LenientFunnelClaim starts in new", () => {
  const item = newLenientFunnelClaim("code-483", "label-825");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFunnelClaim moves to running", () => {
  const item = newLenientFunnelClaim("code-483", "label-825");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientFunnelClaim rejects moves from failed", () => {
  const item = newLenientFunnelClaim("code-483", "label-825");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
