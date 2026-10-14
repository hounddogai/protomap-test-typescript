import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroSummary } from "./macro-summary.js";

test("MacroSummary starts in proposed", () => {
  const item = newMacroSummary("code-803", "label-316");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroSummary moves to approved", () => {
  const item = newMacroSummary("code-803", "label-316");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("MacroSummary rejects moves from withdrawn", () => {
  const item = newMacroSummary("code-803", "label-316");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
