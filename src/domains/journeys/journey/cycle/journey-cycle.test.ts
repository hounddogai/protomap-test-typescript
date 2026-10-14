import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyCycle } from "./journey-cycle.js";

test("JourneyCycle starts in open", () => {
  const item = newJourneyCycle("code-657", "label-597");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyCycle moves to in review", () => {
  const item = newJourneyCycle("code-657", "label-597");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("JourneyCycle rejects moves from archived", () => {
  const item = newJourneyCycle("code-657", "label-597");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
