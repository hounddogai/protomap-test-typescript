import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowProfile } from "./window-profile.js";

test("WindowProfile starts in open", () => {
  const item = newWindowProfile("code-513", "name-29");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowProfile moves to resolved", () => {
  const item = newWindowProfile("code-513", "name-29");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WindowProfile rejects moves from archived", () => {
  const item = newWindowProfile("code-513", "name-29");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
