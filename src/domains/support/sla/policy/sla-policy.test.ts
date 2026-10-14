import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaPolicy } from "./sla-policy.js";

test("SlaPolicy starts in draft", () => {
  const item = newSlaPolicy("code-388", "name-434");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaPolicy moves to pending", () => {
  const item = newSlaPolicy("code-388", "name-434");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SlaPolicy rejects moves from closed", () => {
  const item = newSlaPolicy("code-388", "name-434");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
