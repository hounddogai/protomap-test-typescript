import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingMacroRecord } from "./rolling-macro-record.js";

test("RollingMacroRecord starts in proposed", () => {
  const item = newRollingMacroRecord("code-86", "name-505");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingMacroRecord moves to approved", () => {
  const item = newRollingMacroRecord("code-86", "name-505");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingMacroRecord rejects moves from withdrawn", () => {
  const item = newRollingMacroRecord("code-86", "name-505");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
