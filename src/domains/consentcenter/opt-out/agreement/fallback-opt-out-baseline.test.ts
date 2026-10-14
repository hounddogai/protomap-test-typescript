import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackOptOutBaseline } from "./fallback-opt-out-baseline.js";

test("FallbackOptOutBaseline starts in open", () => {
  const item = newFallbackOptOutBaseline("code-131", "label-63");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackOptOutBaseline moves to archived", () => {
  const item = newFallbackOptOutBaseline("code-131", "label-63");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("FallbackOptOutBaseline rejects moves from archived", () => {
  const item = newFallbackOptOutBaseline("code-131", "label-63");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
