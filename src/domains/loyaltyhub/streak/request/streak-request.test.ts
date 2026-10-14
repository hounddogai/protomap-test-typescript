import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakRequest } from "./streak-request.js";

test("StreakRequest starts in requested", () => {
  const item = newStreakRequest("code-871", "title-518");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakRequest moves to revoked", () => {
  const item = newStreakRequest("code-871", "title-518");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StreakRequest rejects moves from expired", () => {
  const item = newStreakRequest("code-871", "title-518");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
