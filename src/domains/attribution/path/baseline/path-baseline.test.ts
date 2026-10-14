import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathBaseline } from "./path-baseline.js";

test("PathBaseline starts in new", () => {
  const item = newPathBaseline("code-802", "label-448");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathBaseline moves to running", () => {
  const item = newPathBaseline("code-802", "label-448");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PathBaseline rejects moves from failed", () => {
  const item = newPathBaseline("code-802", "label-448");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
