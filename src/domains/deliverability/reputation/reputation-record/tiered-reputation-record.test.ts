import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredReputationRecord } from "./tiered-reputation-record.js";

test("TieredReputationRecord starts in created", () => {
  const item = newTieredReputationRecord("code-85", "name-910");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredReputationRecord moves to published", () => {
  const item = newTieredReputationRecord("code-85", "name-910");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredReputationRecord rejects moves from retired", () => {
  const item = newTieredReputationRecord("code-85", "name-910");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
