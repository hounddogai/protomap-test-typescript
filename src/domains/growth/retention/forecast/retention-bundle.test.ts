import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionBundle } from "./retention-bundle.js";

test("RetentionBundle starts in created", () => {
  const item = newRetentionBundle("code-138", "label-489");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionBundle moves to validated", () => {
  const item = newRetentionBundle("code-138", "label-489");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RetentionBundle rejects moves from retired", () => {
  const item = newRetentionBundle("code-138", "label-489");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
