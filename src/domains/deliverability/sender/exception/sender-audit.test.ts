import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderAudit } from "./sender-audit.js";

test("SenderAudit starts in new", () => {
  const item = newSenderAudit("code-473", "name-628");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderAudit moves to done", () => {
  const item = newSenderAudit("code-473", "name-628");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("SenderAudit rejects moves from failed", () => {
  const item = newSenderAudit("code-473", "name-628");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
