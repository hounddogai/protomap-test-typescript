import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryQueueForecast } from "./primary-queue-forecast.js";

test("PrimaryQueueForecast starts in open", () => {
  const item = newPrimaryQueueForecast("code-987", "title-169");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryQueueForecast moves to in review", () => {
  const item = newPrimaryQueueForecast("code-987", "title-169");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PrimaryQueueForecast rejects moves from archived", () => {
  const item = newPrimaryQueueForecast("code-987", "title-169");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
