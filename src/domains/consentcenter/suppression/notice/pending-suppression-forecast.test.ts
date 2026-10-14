import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSuppressionForecast } from "./pending-suppression-forecast.js";

test("PendingSuppressionForecast starts in created", () => {
  const item = newPendingSuppressionForecast("code-569", "title-155");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSuppressionForecast moves to validated", () => {
  const item = newPendingSuppressionForecast("code-569", "title-155");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingSuppressionForecast rejects moves from retired", () => {
  const item = newPendingSuppressionForecast("code-569", "title-155");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
