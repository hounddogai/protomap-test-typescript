import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyMacroPolicy } from "./legacy-macro-policy.js";

test("LegacyMacroPolicy starts in open", () => {
  const item = newLegacyMacroPolicy("code-645", "title-758");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyMacroPolicy moves to resolved", () => {
  const item = newLegacyMacroPolicy("code-645", "title-758");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LegacyMacroPolicy rejects moves from archived", () => {
  const item = newLegacyMacroPolicy("code-645", "title-758");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
