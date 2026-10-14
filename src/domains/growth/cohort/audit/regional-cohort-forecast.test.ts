import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCohortForecast } from "./regional-cohort-forecast.js";

test("RegionalCohortForecast starts in requested", () => {
  const item = newRegionalCohortForecast("code-311", "name-470");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCohortForecast moves to expired", () => {
  const item = newRegionalCohortForecast("code-311", "name-470");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("RegionalCohortForecast rejects moves from expired", () => {
  const item = newRegionalCohortForecast("code-311", "name-470");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
