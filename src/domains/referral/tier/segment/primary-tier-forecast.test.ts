import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTierForecast } from "./primary-tier-forecast.js";

test("PrimaryTierForecast starts in draft", () => {
  const item = newPrimaryTierForecast("code-432", "name-695");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTierForecast moves to pending", () => {
  const item = newPrimaryTierForecast("code-432", "name-695");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryTierForecast rejects moves from closed", () => {
  const item = newPrimaryTierForecast("code-432", "name-695");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
