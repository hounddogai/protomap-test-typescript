import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultProofWindow } from "./default-proof-window.js";

test("DefaultProofWindow starts in new", () => {
  const item = newDefaultProofWindow("code-591", "name-814");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultProofWindow moves to done", () => {
  const item = newDefaultProofWindow("code-591", "name-814");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DefaultProofWindow rejects moves from failed", () => {
  const item = newDefaultProofWindow("code-591", "name-814");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
