import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredMacroPolicy } from "./tiered-macro-policy.js";

test("TieredMacroPolicy starts in planned", () => {
  const item = newTieredMacroPolicy("code-5", "name-589");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredMacroPolicy moves to scheduled", () => {
  const item = newTieredMacroPolicy("code-5", "name-589");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredMacroPolicy rejects moves from cancelled", () => {
  const item = newTieredMacroPolicy("code-5", "name-589");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
