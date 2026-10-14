import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortForecast } from "./cohort-forecast.js";

test("CohortForecast starts in requested", () => {
  const item = newCohortForecast("code-522", "name-341");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortForecast moves to granted", () => {
  const item = newCohortForecast("code-522", "name-341");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CohortForecast rejects moves from expired", () => {
  const item = newCohortForecast("code-522", "name-341");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
