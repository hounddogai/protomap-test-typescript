import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeSnapshot } from "./badge-snapshot.js";

test("BadgeSnapshot starts in open", () => {
  const item = newBadgeSnapshot("code-510", "label-258");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeSnapshot moves to resolved", () => {
  const item = newBadgeSnapshot("code-510", "label-258");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BadgeSnapshot rejects moves from archived", () => {
  const item = newBadgeSnapshot("code-510", "label-258");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
