import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderTemplate } from "./sender-template.js";

test("SenderTemplate starts in idle", () => {
  const item = newSenderTemplate("code-968", "name-668");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderTemplate moves to warming", () => {
  const item = newSenderTemplate("code-968", "name-668");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SenderTemplate rejects moves from stopped", () => {
  const item = newSenderTemplate("code-968", "name-668");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
