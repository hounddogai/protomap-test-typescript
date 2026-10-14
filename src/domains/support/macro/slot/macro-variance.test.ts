import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroVariance } from "./macro-variance.js";

test("MacroVariance starts in new", () => {
  const item = newMacroVariance("code-744", "label-758");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroVariance moves to queued", () => {
  const item = newMacroVariance("code-744", "label-758");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("MacroVariance rejects moves from failed", () => {
  const item = newMacroVariance("code-744", "label-758");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
