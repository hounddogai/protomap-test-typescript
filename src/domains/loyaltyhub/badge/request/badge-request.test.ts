import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeRequest } from "./badge-request.js";

test("BadgeRequest starts in proposed", () => {
  const item = newBadgeRequest("code-940", "label-769");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeRequest moves to approved", () => {
  const item = newBadgeRequest("code-940", "label-769");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BadgeRequest rejects moves from withdrawn", () => {
  const item = newBadgeRequest("code-940", "label-769");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
