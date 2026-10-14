import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeWindow } from "./nudge-window.js";

test("NudgeWindow starts in requested", () => {
  const item = newNudgeWindow("code-852", "title-209");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeWindow moves to revoked", () => {
  const item = newNudgeWindow("code-852", "title-209");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("NudgeWindow rejects moves from expired", () => {
  const item = newNudgeWindow("code-852", "title-209");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
