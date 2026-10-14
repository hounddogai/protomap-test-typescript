import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowRule } from "./window-rule.js";

test("WindowRule starts in idle", () => {
  const item = newWindowRule("code-971", "name-43");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowRule moves to draining", () => {
  const item = newWindowRule("code-971", "name-43");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("WindowRule rejects moves from stopped", () => {
  const item = newWindowRule("code-971", "name-43");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
