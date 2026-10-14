import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDomainScore } from "./scheduled-domain-score.js";

test("ScheduledDomainScore starts in proposed", () => {
  const item = newScheduledDomainScore("code-932", "label-519");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDomainScore moves to approved", () => {
  const item = newScheduledDomainScore("code-932", "label-519");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledDomainScore rejects moves from withdrawn", () => {
  const item = newScheduledDomainScore("code-932", "label-519");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
