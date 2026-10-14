import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalExitRuleEntry } from "./global-exit-rule-entry.js";

test("GlobalExitRuleEntry starts in planned", () => {
  const item = newGlobalExitRuleEntry("code-757", "label-957");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalExitRuleEntry moves to scheduled", () => {
  const item = newGlobalExitRuleEntry("code-757", "label-957");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("GlobalExitRuleEntry rejects moves from cancelled", () => {
  const item = newGlobalExitRuleEntry("code-757", "label-957");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
