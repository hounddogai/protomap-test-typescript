import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainMilestone } from "./domain-milestone.js";

test("DomainMilestone starts in open", () => {
  const item = newDomainMilestone("code-954", "name-850");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainMilestone moves to in review", () => {
  const item = newDomainMilestone("code-954", "name-850");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DomainMilestone rejects moves from archived", () => {
  const item = newDomainMilestone("code-954", "name-850");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
