import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightRequest } from "./insight-request.js";

test("InsightRequest starts in idle", () => {
  const item = newInsightRequest("code-999", "title-744");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightRequest moves to warming", () => {
  const item = newInsightRequest("code-999", "title-744");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("InsightRequest rejects moves from stopped", () => {
  const item = newInsightRequest("code-999", "title-744");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
