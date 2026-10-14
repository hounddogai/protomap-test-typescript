import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortSegment } from "./cohort-segment.js";

test("CohortSegment starts in idle", () => {
  const item = newCohortSegment("code-897", "title-171");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortSegment moves to warming", () => {
  const item = newCohortSegment("code-897", "title-171");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CohortSegment rejects moves from stopped", () => {
  const item = newCohortSegment("code-897", "title-171");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
