import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionForecast } from "./conversion-forecast.js";

test("ConversionForecast starts in proposed", () => {
  const item = newConversionForecast("code-98", "label-505");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionForecast moves to approved", () => {
  const item = newConversionForecast("code-98", "label-505");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ConversionForecast rejects moves from withdrawn", () => {
  const item = newConversionForecast("code-98", "label-505");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
