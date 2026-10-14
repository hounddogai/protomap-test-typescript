import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostTemplate } from "./post-template.js";

test("PostTemplate starts in planned", () => {
  const item = newPostTemplate("code-462", "name-693");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostTemplate moves to completed", () => {
  const item = newPostTemplate("code-462", "name-693");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PostTemplate rejects moves from cancelled", () => {
  const item = newPostTemplate("code-462", "name-693");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
