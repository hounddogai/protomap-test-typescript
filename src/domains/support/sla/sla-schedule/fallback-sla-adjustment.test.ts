import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSlaAdjustment } from "./fallback-sla-adjustment.js";

test("FallbackSlaAdjustment starts in created", () => {
  const item = newFallbackSlaAdjustment("code-833", "title-170");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSlaAdjustment moves to validated", () => {
  const item = newFallbackSlaAdjustment("code-833", "title-170");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackSlaAdjustment rejects moves from retired", () => {
  const item = newFallbackSlaAdjustment("code-833", "title-170");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
