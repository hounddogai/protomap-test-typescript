import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneyTarget } from "./rolling-journey-target.js";

test("RollingJourneyTarget starts in draft", () => {
  const item = newRollingJourneyTarget("code-965", "title-125");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneyTarget moves to active", () => {
  const item = newRollingJourneyTarget("code-965", "title-125");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RollingJourneyTarget rejects moves from closed", () => {
  const item = newRollingJourneyTarget("code-965", "title-125");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
