import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

test("ScheduledFunnelThreshold starts in created", () => {
  const item = newScheduledFunnelThreshold("code-463", "title-477");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFunnelThreshold moves to validated", () => {
  const item = newScheduledFunnelThreshold("code-463", "title-477");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledFunnelThreshold rejects moves from retired", () => {
  const item = newScheduledFunnelThreshold("code-463", "title-477");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
