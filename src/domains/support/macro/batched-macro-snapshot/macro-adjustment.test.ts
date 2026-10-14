import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroAdjustment } from "./macro-adjustment.js";

test("MacroAdjustment starts in created", () => {
  const item = newMacroAdjustment("code-491", "title-880");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroAdjustment moves to published", () => {
  const item = newMacroAdjustment("code-491", "title-880");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("MacroAdjustment rejects moves from retired", () => {
  const item = newMacroAdjustment("code-491", "title-880");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
