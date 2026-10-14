import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCohortTemplate } from "./pending-cohort-template.js";

test("PendingCohortTemplate starts in open", () => {
  const item = newPendingCohortTemplate("code-217", "name-653");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCohortTemplate moves to in review", () => {
  const item = newPendingCohortTemplate("code-217", "name-653");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingCohortTemplate rejects moves from archived", () => {
  const item = newPendingCohortTemplate("code-217", "name-653");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
