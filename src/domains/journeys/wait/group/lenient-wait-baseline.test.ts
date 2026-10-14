import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWaitBaseline } from "./lenient-wait-baseline.js";

test("LenientWaitBaseline starts in open", () => {
  const item = newLenientWaitBaseline("code-200", "title-461");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWaitBaseline moves to in review", () => {
  const item = newLenientWaitBaseline("code-200", "title-461");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientWaitBaseline rejects moves from archived", () => {
  const item = newLenientWaitBaseline("code-200", "title-461");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
