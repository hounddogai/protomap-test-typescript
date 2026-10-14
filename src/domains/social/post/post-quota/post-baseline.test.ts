import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostBaseline } from "./post-baseline.js";

test("PostBaseline starts in planned", () => {
  const item = newPostBaseline("code-459", "title-154");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostBaseline moves to cancelled", () => {
  const item = newPostBaseline("code-459", "title-154");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("PostBaseline rejects moves from cancelled", () => {
  const item = newPostBaseline("code-459", "title-154");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
