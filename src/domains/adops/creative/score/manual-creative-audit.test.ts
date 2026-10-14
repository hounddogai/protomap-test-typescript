import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualCreativeAudit } from "./manual-creative-audit.js";

test("ManualCreativeAudit starts in open", () => {
  const item = newManualCreativeAudit("code-926", "title-754");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualCreativeAudit moves to resolved", () => {
  const item = newManualCreativeAudit("code-926", "title-754");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualCreativeAudit rejects moves from archived", () => {
  const item = newManualCreativeAudit("code-926", "title-754");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
