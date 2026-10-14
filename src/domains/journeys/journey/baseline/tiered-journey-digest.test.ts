import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredJourneyDigest } from "./tiered-journey-digest.js";

test("TieredJourneyDigest starts in open", () => {
  const item = newTieredJourneyDigest("code-783", "label-480");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredJourneyDigest moves to in review", () => {
  const item = newTieredJourneyDigest("code-783", "label-480");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("TieredJourneyDigest rejects moves from archived", () => {
  const item = newTieredJourneyDigest("code-783", "label-480");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
