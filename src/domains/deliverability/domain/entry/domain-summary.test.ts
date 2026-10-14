import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainSummary } from "./domain-summary.js";

test("DomainSummary starts in new", () => {
  const item = newDomainSummary("code-178", "title-853");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainSummary moves to failed", () => {
  const item = newDomainSummary("code-178", "title-853");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("DomainSummary rejects moves from failed", () => {
  const item = newDomainSummary("code-178", "title-853");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
