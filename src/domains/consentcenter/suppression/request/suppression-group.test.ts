import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionGroup } from "./suppression-group.js";

test("SuppressionGroup starts in open", () => {
  const item = newSuppressionGroup("code-317", "name-293");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionGroup moves to reopened", () => {
  const item = newSuppressionGroup("code-317", "name-293");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SuppressionGroup rejects moves from archived", () => {
  const item = newSuppressionGroup("code-317", "name-293");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
