import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingRetentionTemplate } from "./rolling-retention-template.js";

test("RollingRetentionTemplate starts in open", () => {
  const item = newRollingRetentionTemplate("code-751", "title-322");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingRetentionTemplate moves to in review", () => {
  const item = newRollingRetentionTemplate("code-751", "title-322");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingRetentionTemplate rejects moves from archived", () => {
  const item = newRollingRetentionTemplate("code-751", "title-322");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
