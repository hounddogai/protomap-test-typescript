import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelTemplate } from "./model-template.js";

test("ModelTemplate starts in new", () => {
  const item = newModelTemplate("code-613", "name-345");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelTemplate moves to running", () => {
  const item = newModelTemplate("code-613", "name-345");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ModelTemplate rejects moves from failed", () => {
  const item = newModelTemplate("code-613", "name-345");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
