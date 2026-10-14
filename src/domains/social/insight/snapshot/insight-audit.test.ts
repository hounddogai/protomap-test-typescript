import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightAudit } from "./insight-audit.js";

test("InsightAudit starts in planned", () => {
  const item = newInsightAudit("code-823", "name-873");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightAudit moves to scheduled", () => {
  const item = newInsightAudit("code-823", "name-873");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("InsightAudit rejects moves from cancelled", () => {
  const item = newInsightAudit("code-823", "name-873");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
