import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionAudit } from "./conversion-audit.js";

test("ConversionAudit starts in created", () => {
  const item = newConversionAudit("code-682", "name-509");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionAudit moves to validated", () => {
  const item = newConversionAudit("code-682", "name-509");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ConversionAudit rejects moves from retired", () => {
  const item = newConversionAudit("code-682", "name-509");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
