import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryMacroEstimate } from "./primary-macro-estimate.js";

test("PrimaryMacroEstimate starts in created", () => {
  const item = newPrimaryMacroEstimate("code-720", "name-561");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryMacroEstimate moves to published", () => {
  const item = newPrimaryMacroEstimate("code-720", "name-561");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimaryMacroEstimate rejects moves from retired", () => {
  const item = newPrimaryMacroEstimate("code-720", "name-561");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
