import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCsatPolicy } from "./strict-csat-policy.js";

test("StrictCsatPolicy starts in idle", () => {
  const item = newStrictCsatPolicy("code-745", "label-220");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCsatPolicy moves to warming", () => {
  const item = newStrictCsatPolicy("code-745", "label-220");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StrictCsatPolicy rejects moves from stopped", () => {
  const item = newStrictCsatPolicy("code-745", "label-220");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
