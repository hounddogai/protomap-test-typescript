import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPathAudit } from "./manual-path-audit.js";

test("ManualPathAudit starts in requested", () => {
  const item = newManualPathAudit("code-576", "label-774");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPathAudit moves to revoked", () => {
  const item = newManualPathAudit("code-576", "label-774");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualPathAudit rejects moves from expired", () => {
  const item = newManualPathAudit("code-576", "label-774");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
