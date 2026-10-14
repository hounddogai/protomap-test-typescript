import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionBundle } from "./suppression-bundle.js";

test("SuppressionBundle starts in created", () => {
  const item = newSuppressionBundle("code-464", "name-638");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionBundle moves to published", () => {
  const item = newSuppressionBundle("code-464", "name-638");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SuppressionBundle rejects moves from retired", () => {
  const item = newSuppressionBundle("code-464", "name-638");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
