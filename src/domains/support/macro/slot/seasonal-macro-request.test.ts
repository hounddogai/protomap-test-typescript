import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalMacroRequest } from "./seasonal-macro-request.js";

test("SeasonalMacroRequest starts in open", () => {
  const item = newSeasonalMacroRequest("code-857", "name-647");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalMacroRequest moves to in review", () => {
  const item = newSeasonalMacroRequest("code-857", "name-647");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalMacroRequest rejects moves from archived", () => {
  const item = newSeasonalMacroRequest("code-857", "name-647");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
