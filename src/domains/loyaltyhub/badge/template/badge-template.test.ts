import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeTemplate } from "./badge-template.js";

test("BadgeTemplate starts in draft", () => {
  const item = newBadgeTemplate("code-698", "name-472");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeTemplate moves to pending", () => {
  const item = newBadgeTemplate("code-698", "name-472");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BadgeTemplate rejects moves from closed", () => {
  const item = newBadgeTemplate("code-698", "name-472");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
