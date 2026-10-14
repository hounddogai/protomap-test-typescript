import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalCreativeForecast } from "./global-creative-forecast.js";

test("GlobalCreativeForecast starts in planned", () => {
  const item = newGlobalCreativeForecast("code-192", "name-551");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalCreativeForecast moves to completed", () => {
  const item = newGlobalCreativeForecast("code-192", "name-551");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("GlobalCreativeForecast rejects moves from cancelled", () => {
  const item = newGlobalCreativeForecast("code-192", "name-551");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
