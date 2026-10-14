import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaForecast } from "./sla-forecast.js";

test("SlaForecast starts in open", () => {
  const item = newSlaForecast("code-188", "title-11");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaForecast moves to archived", () => {
  const item = newSlaForecast("code-188", "title-11");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SlaForecast rejects moves from archived", () => {
  const item = newSlaForecast("code-188", "title-11");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
