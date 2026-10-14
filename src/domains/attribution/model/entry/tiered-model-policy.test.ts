import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredModelPolicy } from "./tiered-model-policy.js";

test("TieredModelPolicy starts in created", () => {
  const item = newTieredModelPolicy("code-949", "name-595");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredModelPolicy moves to validated", () => {
  const item = newTieredModelPolicy("code-949", "name-595");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredModelPolicy rejects moves from retired", () => {
  const item = newTieredModelPolicy("code-949", "name-595");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
