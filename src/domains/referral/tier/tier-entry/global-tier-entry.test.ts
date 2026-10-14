import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalTierEntry } from "./global-tier-entry.js";

test("GlobalTierEntry starts in open", () => {
  const item = newGlobalTierEntry("code-637", "title-318");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalTierEntry moves to in review", () => {
  const item = newGlobalTierEntry("code-637", "title-318");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalTierEntry rejects moves from archived", () => {
  const item = newGlobalTierEntry("code-637", "title-318");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
