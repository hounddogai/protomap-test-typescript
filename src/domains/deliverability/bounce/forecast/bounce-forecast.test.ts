import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceForecast } from "./bounce-forecast.js";

test("BounceForecast starts in proposed", () => {
  const item = newBounceForecast("code-78", "label-228");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceForecast moves to rejected", () => {
  const item = newBounceForecast("code-78", "label-228");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BounceForecast rejects moves from withdrawn", () => {
  const item = newBounceForecast("code-78", "label-228");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
