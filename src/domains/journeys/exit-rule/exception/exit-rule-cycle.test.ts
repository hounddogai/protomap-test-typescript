import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleCycle } from "./exit-rule-cycle.js";

test("ExitRuleCycle starts in new", () => {
  const item = newExitRuleCycle("code-842", "title-36");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleCycle moves to queued", () => {
  const item = newExitRuleCycle("code-842", "title-36");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ExitRuleCycle rejects moves from failed", () => {
  const item = newExitRuleCycle("code-842", "title-36");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
