import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierMilestone } from "./tier-milestone.js";

test("TierMilestone starts in created", () => {
  const item = newTierMilestone("code-223", "title-528");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierMilestone moves to published", () => {
  const item = newTierMilestone("code-223", "title-528");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TierMilestone rejects moves from retired", () => {
  const item = newTierMilestone("code-223", "title-528");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
