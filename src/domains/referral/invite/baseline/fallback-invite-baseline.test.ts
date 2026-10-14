import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackInviteBaseline } from "./fallback-invite-baseline.js";

test("FallbackInviteBaseline starts in open", () => {
  const item = newFallbackInviteBaseline("code-82", "name-67");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackInviteBaseline moves to reopened", () => {
  const item = newFallbackInviteBaseline("code-82", "name-67");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("FallbackInviteBaseline rejects moves from archived", () => {
  const item = newFallbackInviteBaseline("code-82", "name-67");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
