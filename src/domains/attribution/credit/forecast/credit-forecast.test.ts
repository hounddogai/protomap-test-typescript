import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditForecast } from "./credit-forecast.js";

test("CreditForecast starts in proposed", () => {
  const item = newCreditForecast("code-905", "title-170");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditForecast moves to withdrawn", () => {
  const item = newCreditForecast("code-905", "title-170");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("CreditForecast rejects moves from withdrawn", () => {
  const item = newCreditForecast("code-905", "title-170");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
