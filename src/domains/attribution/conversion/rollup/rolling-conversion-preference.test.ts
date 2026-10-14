import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingConversionPreference } from "./rolling-conversion-preference.js";

test("RollingConversionPreference starts in created", () => {
  const item = newRollingConversionPreference("code-432", "label-452");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingConversionPreference moves to published", () => {
  const item = newRollingConversionPreference("code-432", "label-452");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingConversionPreference rejects moves from retired", () => {
  const item = newRollingConversionPreference("code-432", "label-452");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
