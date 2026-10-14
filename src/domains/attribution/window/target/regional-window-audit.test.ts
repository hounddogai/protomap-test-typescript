import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalWindowAudit } from "./regional-window-audit.js";

test("RegionalWindowAudit starts in new", () => {
  const item = newRegionalWindowAudit("code-438", "name-718");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalWindowAudit moves to queued", () => {
  const item = newRegionalWindowAudit("code-438", "name-718");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RegionalWindowAudit rejects moves from failed", () => {
  const item = newRegionalWindowAudit("code-438", "name-718");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
