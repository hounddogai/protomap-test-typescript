import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingMacroEntry } from "./rolling-macro-entry.js";

test("RollingMacroEntry starts in created", () => {
  const item = newRollingMacroEntry("code-426", "label-973");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingMacroEntry moves to published", () => {
  const item = newRollingMacroEntry("code-426", "label-973");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingMacroEntry rejects moves from retired", () => {
  const item = newRollingMacroEntry("code-426", "label-973");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
