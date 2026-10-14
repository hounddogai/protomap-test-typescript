import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortTier } from "./cohort-tier.js";

test("CohortTier starts in open", () => {
  const item = newCohortTier("code-568", "label-416");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortTier moves to archived", () => {
  const item = newCohortTier("code-568", "label-416");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("CohortTier rejects moves from archived", () => {
  const item = newCohortTier("code-568", "label-416");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
