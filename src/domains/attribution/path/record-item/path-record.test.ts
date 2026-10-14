import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathRecord } from "./path-record.js";

test("PathRecord starts in draft", () => {
  const item = newPathRecord("code-207", "name-838");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathRecord moves to pending", () => {
  const item = newPathRecord("code-207", "name-838");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PathRecord rejects moves from closed", () => {
  const item = newPathRecord("code-207", "name-838");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
