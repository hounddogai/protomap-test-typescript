import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalMacroThreshold } from "./global-macro-threshold.js";

test("GlobalMacroThreshold starts in draft", () => {
  const item = newGlobalMacroThreshold("code-938", "title-17");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalMacroThreshold moves to active", () => {
  const item = newGlobalMacroThreshold("code-938", "title-17");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("GlobalMacroThreshold rejects moves from closed", () => {
  const item = newGlobalMacroThreshold("code-938", "title-17");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
