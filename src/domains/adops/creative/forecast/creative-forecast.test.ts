import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeForecast } from "./creative-forecast.js";

test("CreativeForecast starts in new", () => {
  const item = newCreativeForecast("code-681", "name-261");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeForecast moves to running", () => {
  const item = newCreativeForecast("code-681", "name-261");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CreativeForecast rejects moves from failed", () => {
  const item = newCreativeForecast("code-681", "name-261");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
