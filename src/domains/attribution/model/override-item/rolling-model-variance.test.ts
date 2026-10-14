import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingModelVariance } from "./rolling-model-variance.js";

test("RollingModelVariance starts in created", () => {
  const item = newRollingModelVariance("code-845", "name-808");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingModelVariance moves to validated", () => {
  const item = newRollingModelVariance("code-845", "name-808");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingModelVariance rejects moves from retired", () => {
  const item = newRollingModelVariance("code-845", "name-808");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
