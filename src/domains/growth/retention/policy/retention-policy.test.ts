import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionPolicy } from "./retention-policy.js";

test("RetentionPolicy starts in planned", () => {
  const item = newRetentionPolicy("code-888", "name-570");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionPolicy moves to completed", () => {
  const item = newRetentionPolicy("code-888", "name-570");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RetentionPolicy rejects moves from cancelled", () => {
  const item = newRetentionPolicy("code-888", "name-570");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
