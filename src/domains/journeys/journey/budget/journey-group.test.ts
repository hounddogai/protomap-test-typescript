import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyGroup } from "./journey-group.js";

test("JourneyGroup starts in draft", () => {
  const item = newJourneyGroup("code-358", "title-517");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyGroup moves to suspended", () => {
  const item = newJourneyGroup("code-358", "title-517");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("JourneyGroup rejects moves from closed", () => {
  const item = newJourneyGroup("code-358", "title-517");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
