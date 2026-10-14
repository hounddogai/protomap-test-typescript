import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionForecast } from "./deflection-forecast.js";

test("DeflectionForecast starts in draft", () => {
  const item = newDeflectionForecast("code-172", "name-818");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionForecast moves to closed", () => {
  const item = newDeflectionForecast("code-172", "name-818");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("DeflectionForecast rejects moves from closed", () => {
  const item = newDeflectionForecast("code-172", "name-818");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
