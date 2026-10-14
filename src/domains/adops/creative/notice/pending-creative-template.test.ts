import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreativeTemplate } from "./pending-creative-template.js";

test("PendingCreativeTemplate starts in open", () => {
  const item = newPendingCreativeTemplate("code-7", "name-656");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreativeTemplate moves to in review", () => {
  const item = newPendingCreativeTemplate("code-7", "name-656");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingCreativeTemplate rejects moves from archived", () => {
  const item = newPendingCreativeTemplate("code-7", "name-656");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
