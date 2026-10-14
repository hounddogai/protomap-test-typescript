import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientConversionAudit } from "./lenient-conversion-audit.js";

test("LenientConversionAudit starts in created", () => {
  const item = newLenientConversionAudit("code-254", "label-973");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientConversionAudit moves to published", () => {
  const item = newLenientConversionAudit("code-254", "label-973");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientConversionAudit rejects moves from retired", () => {
  const item = newLenientConversionAudit("code-254", "label-973");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
