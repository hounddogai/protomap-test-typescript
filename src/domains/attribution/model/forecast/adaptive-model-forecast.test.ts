import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveModelForecast } from "./adaptive-model-forecast.js";

test("AdaptiveModelForecast starts in idle", () => {
  const item = newAdaptiveModelForecast("code-979", "label-841");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveModelForecast moves to warming", () => {
  const item = newAdaptiveModelForecast("code-979", "label-841");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveModelForecast rejects moves from stopped", () => {
  const item = newAdaptiveModelForecast("code-979", "label-841");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
