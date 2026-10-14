import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPostForecast } from "./manual-post-forecast.js";

test("ManualPostForecast starts in open", () => {
  const item = newManualPostForecast("code-54", "name-234");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPostForecast moves to in review", () => {
  const item = newManualPostForecast("code-54", "name-234");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ManualPostForecast rejects moves from archived", () => {
  const item = newManualPostForecast("code-54", "name-234");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
