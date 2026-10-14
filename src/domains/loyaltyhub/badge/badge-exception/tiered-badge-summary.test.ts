import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBadgeSummary } from "./tiered-badge-summary.js";

test("TieredBadgeSummary starts in open", () => {
  const item = newTieredBadgeSummary("code-575", "title-736");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBadgeSummary moves to resolved", () => {
  const item = newTieredBadgeSummary("code-575", "title-736");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TieredBadgeSummary rejects moves from archived", () => {
  const item = newTieredBadgeSummary("code-575", "title-736");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
