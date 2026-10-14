import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightRecord } from "./insight-record.js";

test("InsightRecord starts in new", () => {
  const item = newInsightRecord("code-440", "name-176");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightRecord moves to queued", () => {
  const item = newInsightRecord("code-440", "name-176");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("InsightRecord rejects moves from failed", () => {
  const item = newInsightRecord("code-440", "name-176");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
