import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroCheckpoint } from "./macro-checkpoint.js";

test("MacroCheckpoint starts in planned", () => {
  const item = newMacroCheckpoint("code-117", "label-268");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroCheckpoint moves to scheduled", () => {
  const item = newMacroCheckpoint("code-117", "label-268");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("MacroCheckpoint rejects moves from cancelled", () => {
  const item = newMacroCheckpoint("code-117", "label-268");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
