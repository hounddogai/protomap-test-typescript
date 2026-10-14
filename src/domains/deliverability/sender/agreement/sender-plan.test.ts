import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderPlan } from "./sender-plan.js";

test("SenderPlan starts in created", () => {
  const item = newSenderPlan("code-325", "title-458");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderPlan moves to validated", () => {
  const item = newSenderPlan("code-325", "title-458");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SenderPlan rejects moves from retired", () => {
  const item = newSenderPlan("code-325", "title-458");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
