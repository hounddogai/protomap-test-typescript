import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderForecast } from "./sender-forecast.js";

test("SenderForecast starts in created", () => {
  const item = newSenderForecast("code-686", "name-217");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderForecast moves to validated", () => {
  const item = newSenderForecast("code-686", "name-217");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SenderForecast rejects moves from retired", () => {
  const item = newSenderForecast("code-686", "name-217");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
