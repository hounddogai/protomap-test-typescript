import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyAudit } from "./journey-audit.js";

test("JourneyAudit starts in draft", () => {
  const item = newJourneyAudit("code-959", "name-834");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyAudit moves to suspended", () => {
  const item = newJourneyAudit("code-959", "name-834");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("JourneyAudit rejects moves from closed", () => {
  const item = newJourneyAudit("code-959", "name-834");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
