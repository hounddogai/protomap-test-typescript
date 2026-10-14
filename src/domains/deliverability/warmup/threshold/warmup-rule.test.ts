import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupRule } from "./warmup-rule.js";

test("WarmupRule starts in proposed", () => {
  const item = newWarmupRule("code-934", "title-13");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupRule moves to withdrawn", () => {
  const item = newWarmupRule("code-934", "title-13");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("WarmupRule rejects moves from withdrawn", () => {
  const item = newWarmupRule("code-934", "title-13");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
