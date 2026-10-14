import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroPlan } from "./macro-plan.js";

test("MacroPlan starts in draft", () => {
  const item = newMacroPlan("code-431", "title-196");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroPlan moves to active", () => {
  const item = newMacroPlan("code-431", "title-196");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("MacroPlan rejects moves from closed", () => {
  const item = newMacroPlan("code-431", "title-196");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
