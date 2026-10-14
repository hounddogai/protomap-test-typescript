import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyDraft } from "./journey-draft.js";

test("JourneyDraft starts in open", () => {
  const item = newJourneyDraft("code-734", "label-268");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyDraft moves to archived", () => {
  const item = newJourneyDraft("code-734", "label-268");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("JourneyDraft rejects moves from archived", () => {
  const item = newJourneyDraft("code-734", "label-268");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
