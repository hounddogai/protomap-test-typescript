import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreativeForecast } from "./pending-creative-forecast.js";

test("PendingCreativeForecast starts in new", () => {
  const item = newPendingCreativeForecast("code-671", "title-400");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreativeForecast moves to running", () => {
  const item = newPendingCreativeForecast("code-671", "title-400");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PendingCreativeForecast rejects moves from failed", () => {
  const item = newPendingCreativeForecast("code-671", "title-400");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
