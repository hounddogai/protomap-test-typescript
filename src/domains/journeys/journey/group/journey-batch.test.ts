import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyBatch } from "./journey-batch.js";

test("JourneyBatch starts in proposed", () => {
  const item = newJourneyBatch("code-545", "title-72");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyBatch moves to approved", () => {
  const item = newJourneyBatch("code-545", "title-72");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("JourneyBatch rejects moves from withdrawn", () => {
  const item = newJourneyBatch("code-545", "title-72");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
