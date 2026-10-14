import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyForecast } from "./frequency-forecast.js";

test("FrequencyForecast starts in new", () => {
  const item = newFrequencyForecast("code-654", "label-920");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyForecast moves to queued", () => {
  const item = newFrequencyForecast("code-654", "label-920");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FrequencyForecast rejects moves from failed", () => {
  const item = newFrequencyForecast("code-654", "label-920");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
