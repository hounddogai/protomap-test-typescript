import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueForecast } from "./queue-forecast.js";

test("QueueForecast starts in planned", () => {
  const item = newQueueForecast("code-476", "name-64");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueForecast moves to in progress", () => {
  const item = newQueueForecast("code-476", "name-64");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("QueueForecast rejects moves from cancelled", () => {
  const item = newQueueForecast("code-476", "name-64");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
