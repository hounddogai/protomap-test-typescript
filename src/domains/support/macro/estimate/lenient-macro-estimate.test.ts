import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientMacroEstimate } from "./lenient-macro-estimate.js";

test("LenientMacroEstimate starts in created", () => {
  const item = newLenientMacroEstimate("code-755", "name-609");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientMacroEstimate moves to validated", () => {
  const item = newLenientMacroEstimate("code-755", "name-609");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LenientMacroEstimate rejects moves from retired", () => {
  const item = newLenientMacroEstimate("code-755", "name-609");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
