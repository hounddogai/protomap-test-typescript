import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

test("FallbackFunnelThreshold starts in created", () => {
  const item = newFallbackFunnelThreshold("code-49", "title-788");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFunnelThreshold moves to validated", () => {
  const item = newFallbackFunnelThreshold("code-49", "title-788");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackFunnelThreshold rejects moves from retired", () => {
  const item = newFallbackFunnelThreshold("code-49", "title-788");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
