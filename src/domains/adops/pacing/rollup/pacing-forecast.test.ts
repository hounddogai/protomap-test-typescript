import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingForecast } from "./pacing-forecast.js";

test("PacingForecast starts in proposed", () => {
  const item = newPacingForecast("code-705", "label-537");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingForecast moves to withdrawn", () => {
  const item = newPacingForecast("code-705", "label-537");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PacingForecast rejects moves from withdrawn", () => {
  const item = newPacingForecast("code-705", "label-537");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
