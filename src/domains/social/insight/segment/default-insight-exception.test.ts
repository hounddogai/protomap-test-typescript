import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultInsightException } from "./default-insight-exception.js";

test("DefaultInsightException starts in open", () => {
  const item = newDefaultInsightException("code-226", "title-492");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultInsightException moves to resolved", () => {
  const item = newDefaultInsightException("code-226", "title-492");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultInsightException rejects moves from archived", () => {
  const item = newDefaultInsightException("code-226", "title-492");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
