import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderSnapshot } from "./sender-snapshot.js";

test("SenderSnapshot starts in open", () => {
  const item = newSenderSnapshot("code-72", "label-991");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderSnapshot moves to resolved", () => {
  const item = newSenderSnapshot("code-72", "label-991");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SenderSnapshot rejects moves from archived", () => {
  const item = newSenderSnapshot("code-72", "label-991");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
