import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveModelAudit } from "./adaptive-model-audit.js";

test("AdaptiveModelAudit starts in draft", () => {
  const item = newAdaptiveModelAudit("code-405", "name-428");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveModelAudit moves to active", () => {
  const item = newAdaptiveModelAudit("code-405", "name-428");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("AdaptiveModelAudit rejects moves from closed", () => {
  const item = newAdaptiveModelAudit("code-405", "name-428");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
