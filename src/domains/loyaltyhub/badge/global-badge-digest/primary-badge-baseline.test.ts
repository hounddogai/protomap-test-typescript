import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBadgeBaseline } from "./primary-badge-baseline.js";

test("PrimaryBadgeBaseline starts in created", () => {
  const item = newPrimaryBadgeBaseline("code-551", "name-948");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBadgeBaseline moves to validated", () => {
  const item = newPrimaryBadgeBaseline("code-551", "name-948");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PrimaryBadgeBaseline rejects moves from retired", () => {
  const item = newPrimaryBadgeBaseline("code-551", "name-948");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
