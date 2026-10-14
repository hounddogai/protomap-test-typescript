import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPostSummary } from "./strict-post-summary.js";

test("StrictPostSummary starts in draft", () => {
  const item = newStrictPostSummary("code-433", "title-946");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPostSummary moves to active", () => {
  const item = newStrictPostSummary("code-433", "title-946");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("StrictPostSummary rejects moves from closed", () => {
  const item = newStrictPostSummary("code-433", "title-946");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
