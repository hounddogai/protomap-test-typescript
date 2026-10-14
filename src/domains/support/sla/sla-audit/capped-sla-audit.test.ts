import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSlaAudit } from "./capped-sla-audit.js";

test("CappedSlaAudit starts in open", () => {
  const item = newCappedSlaAudit("code-705", "label-461");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSlaAudit moves to archived", () => {
  const item = newCappedSlaAudit("code-705", "label-461");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("CappedSlaAudit rejects moves from archived", () => {
  const item = newCappedSlaAudit("code-705", "label-461");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
