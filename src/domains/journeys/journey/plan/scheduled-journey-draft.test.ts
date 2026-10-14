import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledJourneyDraft } from "./scheduled-journey-draft.js";

test("ScheduledJourneyDraft starts in open", () => {
  const item = newScheduledJourneyDraft("code-138", "title-230");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledJourneyDraft moves to resolved", () => {
  const item = newScheduledJourneyDraft("code-138", "title-230");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledJourneyDraft rejects moves from archived", () => {
  const item = newScheduledJourneyDraft("code-138", "title-230");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
