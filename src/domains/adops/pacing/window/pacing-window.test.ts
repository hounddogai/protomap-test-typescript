import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingWindow } from "./pacing-window.js";

test("PacingWindow starts in requested", () => {
  const item = newPacingWindow("code-400", "title-443");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingWindow moves to revoked", () => {
  const item = newPacingWindow("code-400", "title-443");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PacingWindow rejects moves from expired", () => {
  const item = newPacingWindow("code-400", "title-443");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
