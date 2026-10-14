import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleForecast } from "./exit-rule-forecast.js";

test("ExitRuleForecast starts in proposed", () => {
  const item = newExitRuleForecast("code-117", "name-389");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleForecast moves to rejected", () => {
  const item = newExitRuleForecast("code-117", "name-389");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ExitRuleForecast rejects moves from withdrawn", () => {
  const item = newExitRuleForecast("code-117", "name-389");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
