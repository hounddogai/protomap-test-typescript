import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSlaNotice } from "./lenient-sla-notice.js";

test("LenientSlaNotice starts in open", () => {
  const item = newLenientSlaNotice("code-953", "name-453");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSlaNotice moves to in review", () => {
  const item = newLenientSlaNotice("code-953", "name-453");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientSlaNotice rejects moves from archived", () => {
  const item = newLenientSlaNotice("code-953", "name-453");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
