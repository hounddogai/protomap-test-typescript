import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleWindow } from "./exit-rule-window.js";

test("ExitRuleWindow starts in open", () => {
  const item = newExitRuleWindow("code-417", "name-805");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleWindow moves to reopened", () => {
  const item = newExitRuleWindow("code-417", "name-805");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ExitRuleWindow rejects moves from archived", () => {
  const item = newExitRuleWindow("code-417", "name-805");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
