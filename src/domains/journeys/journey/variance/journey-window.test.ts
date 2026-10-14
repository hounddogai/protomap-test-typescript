import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyWindow } from "./journey-window.js";

test("JourneyWindow starts in planned", () => {
  const item = newJourneyWindow("code-948", "name-753");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyWindow moves to in progress", () => {
  const item = newJourneyWindow("code-948", "name-753");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("JourneyWindow rejects moves from cancelled", () => {
  const item = newJourneyWindow("code-948", "name-753");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
