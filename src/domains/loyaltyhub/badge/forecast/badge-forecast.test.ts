import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeForecast } from "./badge-forecast.js";

test("BadgeForecast starts in draft", () => {
  const item = newBadgeForecast("code-127", "label-128");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeForecast moves to closed", () => {
  const item = newBadgeForecast("code-127", "label-128");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("BadgeForecast rejects moves from closed", () => {
  const item = newBadgeForecast("code-127", "label-128");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
