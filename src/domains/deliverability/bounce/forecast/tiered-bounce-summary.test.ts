import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBounceSummary } from "./tiered-bounce-summary.js";

test("TieredBounceSummary starts in created", () => {
  const item = newTieredBounceSummary("code-72", "name-930");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBounceSummary moves to validated", () => {
  const item = newTieredBounceSummary("code-72", "name-930");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredBounceSummary rejects moves from retired", () => {
  const item = newTieredBounceSummary("code-72", "name-930");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
