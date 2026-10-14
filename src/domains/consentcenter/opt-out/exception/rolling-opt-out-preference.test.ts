import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingOptOutPreference } from "./rolling-opt-out-preference.js";

test("RollingOptOutPreference starts in created", () => {
  const item = newRollingOptOutPreference("code-862", "title-728");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingOptOutPreference moves to validated", () => {
  const item = newRollingOptOutPreference("code-862", "title-728");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingOptOutPreference rejects moves from retired", () => {
  const item = newRollingOptOutPreference("code-862", "title-728");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
