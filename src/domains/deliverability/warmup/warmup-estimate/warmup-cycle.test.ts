import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupCycle } from "./warmup-cycle.js";

test("WarmupCycle starts in created", () => {
  const item = newWarmupCycle("code-644", "label-695");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupCycle moves to validated", () => {
  const item = newWarmupCycle("code-644", "label-695");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WarmupCycle rejects moves from retired", () => {
  const item = newWarmupCycle("code-644", "label-695");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
