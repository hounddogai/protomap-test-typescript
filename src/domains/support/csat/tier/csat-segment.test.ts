import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatSegment } from "./csat-segment.js";

test("CsatSegment starts in draft", () => {
  const item = newCsatSegment("code-499", "name-372");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatSegment moves to suspended", () => {
  const item = newCsatSegment("code-499", "name-372");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("CsatSegment rejects moves from closed", () => {
  const item = newCsatSegment("code-499", "name-372");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
