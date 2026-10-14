import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultExitRuleForecast } from "./default-exit-rule-forecast.js";

test("DefaultExitRuleForecast starts in created", () => {
  const item = newDefaultExitRuleForecast("code-933", "title-62");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultExitRuleForecast moves to published", () => {
  const item = newDefaultExitRuleForecast("code-933", "title-62");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("DefaultExitRuleForecast rejects moves from retired", () => {
  const item = newDefaultExitRuleForecast("code-933", "title-62");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
