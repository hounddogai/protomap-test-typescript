import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionAudit } from "./retention-audit.js";

test("RetentionAudit starts in open", () => {
  const item = newRetentionAudit("code-895", "title-830");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionAudit moves to in review", () => {
  const item = newRetentionAudit("code-895", "title-830");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RetentionAudit rejects moves from archived", () => {
  const item = newRetentionAudit("code-895", "title-830");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
