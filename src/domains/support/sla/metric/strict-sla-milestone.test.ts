import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSlaMilestone } from "./strict-sla-milestone.js";

test("StrictSlaMilestone starts in proposed", () => {
  const item = newStrictSlaMilestone("code-151", "name-275");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSlaMilestone moves to approved", () => {
  const item = newStrictSlaMilestone("code-151", "name-275");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StrictSlaMilestone rejects moves from withdrawn", () => {
  const item = newStrictSlaMilestone("code-151", "name-275");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
