import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyPreference } from "./journey-preference.js";

test("JourneyPreference starts in open", () => {
  const item = newJourneyPreference("code-42", "title-324");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyPreference moves to resolved", () => {
  const item = newJourneyPreference("code-42", "title-324");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("JourneyPreference rejects moves from archived", () => {
  const item = newJourneyPreference("code-42", "title-324");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
