import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroSchedule } from "./macro-schedule.js";

test("MacroSchedule starts in planned", () => {
  const item = newMacroSchedule("code-163", "title-774");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroSchedule moves to cancelled", () => {
  const item = newMacroSchedule("code-163", "title-774");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("MacroSchedule rejects moves from cancelled", () => {
  const item = newMacroSchedule("code-163", "title-774");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
