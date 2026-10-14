import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightBundle } from "./insight-bundle.js";

test("InsightBundle starts in created", () => {
  const item = newInsightBundle("code-451", "name-839");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightBundle moves to validated", () => {
  const item = newInsightBundle("code-451", "name-839");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("InsightBundle rejects moves from retired", () => {
  const item = newInsightBundle("code-451", "name-839");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
