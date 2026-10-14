import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierBaseline } from "./tier-baseline.js";

test("TierBaseline starts in created", () => {
  const item = newTierBaseline("code-578", "label-341");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierBaseline moves to validated", () => {
  const item = newTierBaseline("code-578", "label-341");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TierBaseline rejects moves from retired", () => {
  const item = newTierBaseline("code-578", "label-341");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
