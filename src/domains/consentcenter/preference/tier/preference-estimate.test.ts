import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceEstimate } from "./preference-estimate.js";

test("PreferenceEstimate starts in created", () => {
  const item = newPreferenceEstimate("code-353", "title-863");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceEstimate moves to validated", () => {
  const item = newPreferenceEstimate("code-353", "title-863");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PreferenceEstimate rejects moves from retired", () => {
  const item = newPreferenceEstimate("code-353", "title-863");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
