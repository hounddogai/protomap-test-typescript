import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightQuota } from "./insight-quota.js";

test("InsightQuota starts in draft", () => {
  const item = newInsightQuota("code-996", "title-534");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightQuota moves to closed", () => {
  const item = newInsightQuota("code-996", "title-534");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("InsightQuota rejects moves from closed", () => {
  const item = newInsightQuota("code-996", "title-534");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
