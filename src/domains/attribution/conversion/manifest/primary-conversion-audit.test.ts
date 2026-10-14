import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryConversionAudit } from "./primary-conversion-audit.js";

test("PrimaryConversionAudit starts in open", () => {
  const item = newPrimaryConversionAudit("code-319", "title-388");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryConversionAudit moves to archived", () => {
  const item = newPrimaryConversionAudit("code-319", "title-388");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PrimaryConversionAudit rejects moves from archived", () => {
  const item = newPrimaryConversionAudit("code-319", "title-388");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
