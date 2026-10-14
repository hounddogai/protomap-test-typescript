import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCreativeForecast } from "./adaptive-creative-forecast.js";

test("AdaptiveCreativeForecast starts in new", () => {
  const item = newAdaptiveCreativeForecast("code-336", "name-170");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCreativeForecast moves to queued", () => {
  const item = newAdaptiveCreativeForecast("code-336", "name-170");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveCreativeForecast rejects moves from failed", () => {
  const item = newAdaptiveCreativeForecast("code-336", "name-170");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
