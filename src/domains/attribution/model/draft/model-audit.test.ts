import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelAudit } from "./model-audit.js";

test("ModelAudit starts in created", () => {
  const item = newModelAudit("code-178", "name-786");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelAudit moves to validated", () => {
  const item = newModelAudit("code-178", "name-786");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ModelAudit rejects moves from retired", () => {
  const item = newModelAudit("code-178", "name-786");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
