import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackOptOutRule } from "./fallback-opt-out-rule.js";

test("FallbackOptOutRule starts in created", () => {
  const item = newFallbackOptOutRule("code-27", "label-897");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackOptOutRule moves to published", () => {
  const item = newFallbackOptOutRule("code-27", "label-897");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FallbackOptOutRule rejects moves from retired", () => {
  const item = newFallbackOptOutRule("code-27", "label-897");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
