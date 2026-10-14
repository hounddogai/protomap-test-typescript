import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatQuota } from "./csat-quota.js";

test("CsatQuota starts in open", () => {
  const item = newCsatQuota("code-50", "name-168");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatQuota moves to in review", () => {
  const item = newCsatQuota("code-50", "name-168");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CsatQuota rejects moves from archived", () => {
  const item = newCsatQuota("code-50", "name-168");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
