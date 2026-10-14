import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFunnelException } from "./capped-funnel-exception.js";

test("CappedFunnelException starts in planned", () => {
  const item = newCappedFunnelException("code-253", "label-743");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFunnelException moves to scheduled", () => {
  const item = newCappedFunnelException("code-253", "label-743");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedFunnelException rejects moves from cancelled", () => {
  const item = newCappedFunnelException("code-253", "label-743");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
