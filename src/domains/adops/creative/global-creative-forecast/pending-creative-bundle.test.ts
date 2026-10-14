import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreativeBundle } from "./pending-creative-bundle.js";

test("PendingCreativeBundle starts in created", () => {
  const item = newPendingCreativeBundle("code-999", "name-84");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreativeBundle moves to published", () => {
  const item = newPendingCreativeBundle("code-999", "name-84");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingCreativeBundle rejects moves from retired", () => {
  const item = newPendingCreativeBundle("code-999", "name-84");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
