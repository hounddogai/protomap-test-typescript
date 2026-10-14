import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMacroOverride } from "./default-macro-override.js";

test("DefaultMacroOverride starts in open", () => {
  const item = newDefaultMacroOverride("code-491", "title-953");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMacroOverride moves to in review", () => {
  const item = newDefaultMacroOverride("code-491", "title-953");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DefaultMacroOverride rejects moves from archived", () => {
  const item = newDefaultMacroOverride("code-491", "title-953");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
