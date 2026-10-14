import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalConversionWindow } from "./global-conversion-window.js";

test("GlobalConversionWindow starts in created", () => {
  const item = newGlobalConversionWindow("code-930", "label-99");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalConversionWindow moves to validated", () => {
  const item = newGlobalConversionWindow("code-930", "label-99");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("GlobalConversionWindow rejects moves from retired", () => {
  const item = newGlobalConversionWindow("code-930", "label-99");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
