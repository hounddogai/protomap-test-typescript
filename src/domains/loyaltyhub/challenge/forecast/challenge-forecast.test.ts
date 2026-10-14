import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeForecast } from "./challenge-forecast.js";

test("ChallengeForecast starts in new", () => {
  const item = newChallengeForecast("code-161", "name-918");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeForecast moves to failed", () => {
  const item = newChallengeForecast("code-161", "name-918");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ChallengeForecast rejects moves from failed", () => {
  const item = newChallengeForecast("code-161", "name-918");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
