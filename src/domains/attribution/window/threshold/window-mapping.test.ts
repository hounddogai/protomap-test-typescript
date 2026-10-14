import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowMapping } from "./window-mapping.js";

test("WindowMapping starts in open", () => {
  const item = newWindowMapping("code-378", "name-100");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowMapping moves to in review", () => {
  const item = newWindowMapping("code-378", "name-100");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WindowMapping rejects moves from archived", () => {
  const item = newWindowMapping("code-378", "name-100");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
