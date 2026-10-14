import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderEntry } from "./sender-entry.js";

test("SenderEntry starts in created", () => {
  const item = newSenderEntry("code-731", "label-500");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderEntry moves to validated", () => {
  const item = newSenderEntry("code-731", "label-500");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SenderEntry rejects moves from retired", () => {
  const item = newSenderEntry("code-731", "label-500");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
