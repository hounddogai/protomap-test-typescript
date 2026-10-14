import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceTier } from "./preference-tier.js";

test("PreferenceTier starts in created", () => {
  const item = newPreferenceTier("code-780", "label-756");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceTier moves to retired", () => {
  const item = newPreferenceTier("code-780", "label-756");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PreferenceTier rejects moves from retired", () => {
  const item = newPreferenceTier("code-780", "label-756");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
