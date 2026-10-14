import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBadgeTemplate } from "./global-badge-template.js";

test("GlobalBadgeTemplate starts in open", () => {
  const item = newGlobalBadgeTemplate("code-242", "label-978");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBadgeTemplate moves to in review", () => {
  const item = newGlobalBadgeTemplate("code-242", "label-978");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalBadgeTemplate rejects moves from archived", () => {
  const item = newGlobalBadgeTemplate("code-242", "label-978");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
