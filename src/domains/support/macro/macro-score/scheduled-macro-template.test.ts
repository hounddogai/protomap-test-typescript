import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMacroTemplate } from "./scheduled-macro-template.js";

test("ScheduledMacroTemplate starts in proposed", () => {
  const item = newScheduledMacroTemplate("code-447", "name-825");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMacroTemplate moves to rejected", () => {
  const item = newScheduledMacroTemplate("code-447", "name-825");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ScheduledMacroTemplate rejects moves from withdrawn", () => {
  const item = newScheduledMacroTemplate("code-447", "name-825");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
