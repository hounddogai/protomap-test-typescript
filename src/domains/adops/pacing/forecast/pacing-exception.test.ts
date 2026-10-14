import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingException } from "./pacing-exception.js";

test("PacingException starts in draft", () => {
  const item = newPacingException("code-91", "title-810");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingException moves to active", () => {
  const item = newPacingException("code-91", "title-810");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PacingException rejects moves from closed", () => {
  const item = newPacingException("code-91", "title-810");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
