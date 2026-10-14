import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMacroBaseline } from "./default-macro-baseline.js";

test("DefaultMacroBaseline starts in proposed", () => {
  const item = newDefaultMacroBaseline("code-542", "name-696");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMacroBaseline moves to approved", () => {
  const item = newDefaultMacroBaseline("code-542", "name-696");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultMacroBaseline rejects moves from withdrawn", () => {
  const item = newDefaultMacroBaseline("code-542", "name-696");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
