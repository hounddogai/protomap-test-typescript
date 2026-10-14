import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSlaTemplate } from "./fallback-sla-template.js";

test("FallbackSlaTemplate starts in idle", () => {
  const item = newFallbackSlaTemplate("code-690", "label-234");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSlaTemplate moves to ready", () => {
  const item = newFallbackSlaTemplate("code-690", "label-234");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackSlaTemplate rejects moves from stopped", () => {
  const item = newFallbackSlaTemplate("code-690", "label-234");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
