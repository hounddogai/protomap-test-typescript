import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathSegment } from "./path-segment.js";

test("PathSegment starts in open", () => {
  const item = newPathSegment("code-602", "title-960");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathSegment moves to in review", () => {
  const item = newPathSegment("code-602", "title-960");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PathSegment rejects moves from archived", () => {
  const item = newPathSegment("code-602", "title-960");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
