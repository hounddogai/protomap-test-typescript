import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathSummary } from "./path-summary.js";

test("PathSummary starts in created", () => {
  const item = newPathSummary("code-882", "label-261");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathSummary moves to validated", () => {
  const item = newPathSummary("code-882", "label-261");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PathSummary rejects moves from retired", () => {
  const item = newPathSummary("code-882", "label-261");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
