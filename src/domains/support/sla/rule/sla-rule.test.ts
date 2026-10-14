import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaRule } from "./sla-rule.js";

test("SlaRule starts in created", () => {
  const item = newSlaRule("code-428", "label-585");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaRule moves to validated", () => {
  const item = newSlaRule("code-428", "label-585");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SlaRule rejects moves from retired", () => {
  const item = newSlaRule("code-428", "label-585");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
