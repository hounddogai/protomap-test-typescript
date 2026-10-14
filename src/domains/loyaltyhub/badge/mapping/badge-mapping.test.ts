import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeMapping } from "./badge-mapping.js";

test("BadgeMapping starts in open", () => {
  const item = newBadgeMapping("code-702", "label-79");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeMapping moves to in review", () => {
  const item = newBadgeMapping("code-702", "label-79");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BadgeMapping rejects moves from archived", () => {
  const item = newBadgeMapping("code-702", "label-79");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
