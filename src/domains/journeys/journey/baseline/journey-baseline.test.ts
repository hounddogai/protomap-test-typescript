import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyBaseline } from "./journey-baseline.js";

test("JourneyBaseline starts in new", () => {
  const item = newJourneyBaseline("code-906", "title-96");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyBaseline moves to running", () => {
  const item = newJourneyBaseline("code-906", "title-96");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("JourneyBaseline rejects moves from failed", () => {
  const item = newJourneyBaseline("code-906", "title-96");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
