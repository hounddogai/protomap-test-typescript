import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSlaForecast } from "./pending-sla-forecast.js";

test("PendingSlaForecast starts in requested", () => {
  const item = newPendingSlaForecast("code-529", "name-459");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSlaForecast moves to granted", () => {
  const item = newPendingSlaForecast("code-529", "name-459");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PendingSlaForecast rejects moves from expired", () => {
  const item = newPendingSlaForecast("code-529", "name-459");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
