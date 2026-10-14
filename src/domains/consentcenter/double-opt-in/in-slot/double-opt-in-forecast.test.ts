import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInForecast } from "./double-opt-in-forecast.js";

test("DoubleOptInForecast starts in proposed", () => {
  const item = newDoubleOptInForecast("code-272", "title-368");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInForecast moves to approved", () => {
  const item = newDoubleOptInForecast("code-272", "title-368");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DoubleOptInForecast rejects moves from withdrawn", () => {
  const item = newDoubleOptInForecast("code-272", "title-368");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
