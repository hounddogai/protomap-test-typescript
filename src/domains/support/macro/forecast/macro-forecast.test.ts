import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroForecast } from "./macro-forecast.js";

test("MacroForecast starts in draft", () => {
  const item = newMacroForecast("code-716", "label-710");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroForecast moves to closed", () => {
  const item = newMacroForecast("code-716", "label-710");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("MacroForecast rejects moves from closed", () => {
  const item = newMacroForecast("code-716", "label-710");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
