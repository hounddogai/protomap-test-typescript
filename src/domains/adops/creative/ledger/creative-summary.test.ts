import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeSummary } from "./creative-summary.js";

test("CreativeSummary starts in new", () => {
  const item = newCreativeSummary("code-238", "name-950");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeSummary moves to running", () => {
  const item = newCreativeSummary("code-238", "name-950");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CreativeSummary rejects moves from failed", () => {
  const item = newCreativeSummary("code-238", "name-950");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
