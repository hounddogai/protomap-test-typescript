import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferencePlan } from "./preference-plan.js";

test("PreferencePlan starts in proposed", () => {
  const item = newPreferencePlan("code-886", "label-120");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferencePlan moves to rejected", () => {
  const item = newPreferencePlan("code-886", "label-120");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PreferencePlan rejects moves from withdrawn", () => {
  const item = newPreferencePlan("code-886", "label-120");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
