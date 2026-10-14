import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveMacroPreference } from "./adaptive-macro-preference.js";

test("AdaptiveMacroPreference starts in planned", () => {
  const item = newAdaptiveMacroPreference("code-180", "name-863");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveMacroPreference moves to completed", () => {
  const item = newAdaptiveMacroPreference("code-180", "name-863");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("AdaptiveMacroPreference rejects moves from cancelled", () => {
  const item = newAdaptiveMacroPreference("code-180", "name-863");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
