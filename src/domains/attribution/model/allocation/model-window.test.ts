import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelWindow } from "./model-window.js";

test("ModelWindow starts in open", () => {
  const item = newModelWindow("code-509", "name-925");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelWindow moves to in review", () => {
  const item = newModelWindow("code-509", "name-925");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ModelWindow rejects moves from archived", () => {
  const item = newModelWindow("code-509", "name-925");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
