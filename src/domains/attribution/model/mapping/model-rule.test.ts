import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelRule } from "./model-rule.js";

test("ModelRule starts in idle", () => {
  const item = newModelRule("code-604", "name-216");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelRule moves to warming", () => {
  const item = newModelRule("code-604", "name-216");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ModelRule rejects moves from stopped", () => {
  const item = newModelRule("code-604", "name-216");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
