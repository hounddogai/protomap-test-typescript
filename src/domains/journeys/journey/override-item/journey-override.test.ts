import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyOverride } from "./journey-override.js";

test("JourneyOverride starts in proposed", () => {
  const item = newJourneyOverride("code-134", "name-953");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyOverride moves to approved", () => {
  const item = newJourneyOverride("code-134", "name-953");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("JourneyOverride rejects moves from withdrawn", () => {
  const item = newJourneyOverride("code-134", "name-953");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
