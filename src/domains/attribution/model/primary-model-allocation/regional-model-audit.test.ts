import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalModelAudit } from "./regional-model-audit.js";

test("RegionalModelAudit starts in requested", () => {
  const item = newRegionalModelAudit("code-889", "title-634");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalModelAudit moves to revoked", () => {
  const item = newRegionalModelAudit("code-889", "title-634");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RegionalModelAudit rejects moves from expired", () => {
  const item = newRegionalModelAudit("code-889", "title-634");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
