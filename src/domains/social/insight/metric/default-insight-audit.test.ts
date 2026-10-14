import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultInsightAudit } from "./default-insight-audit.js";

test("DefaultInsightAudit starts in new", () => {
  const item = newDefaultInsightAudit("code-55", "title-700");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultInsightAudit moves to queued", () => {
  const item = newDefaultInsightAudit("code-55", "title-700");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("DefaultInsightAudit rejects moves from failed", () => {
  const item = newDefaultInsightAudit("code-55", "title-700");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
