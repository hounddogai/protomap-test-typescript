import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderGroup } from "./sender-group.js";

test("SenderGroup starts in planned", () => {
  const item = newSenderGroup("code-879", "name-671");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderGroup moves to cancelled", () => {
  const item = newSenderGroup("code-879", "name-671");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("SenderGroup rejects moves from cancelled", () => {
  const item = newSenderGroup("code-879", "name-671");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
