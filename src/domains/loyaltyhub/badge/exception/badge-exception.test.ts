import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeException } from "./badge-exception.js";

test("BadgeException starts in proposed", () => {
  const item = newBadgeException("code-950", "title-527");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeException moves to rejected", () => {
  const item = newBadgeException("code-950", "title-527");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BadgeException rejects moves from withdrawn", () => {
  const item = newBadgeException("code-950", "title-527");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
