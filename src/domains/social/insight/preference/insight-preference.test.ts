import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightPreference } from "./insight-preference.js";

test("InsightPreference starts in new", () => {
  const item = newInsightPreference("code-134", "name-99");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightPreference moves to done", () => {
  const item = newInsightPreference("code-134", "name-99");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("InsightPreference rejects moves from failed", () => {
  const item = newInsightPreference("code-134", "name-99");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
