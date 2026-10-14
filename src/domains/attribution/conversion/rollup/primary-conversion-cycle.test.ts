import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryConversionCycle } from "./primary-conversion-cycle.js";

test("PrimaryConversionCycle starts in open", () => {
  const item = newPrimaryConversionCycle("code-312", "label-880");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryConversionCycle moves to archived", () => {
  const item = newPrimaryConversionCycle("code-312", "label-880");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PrimaryConversionCycle rejects moves from archived", () => {
  const item = newPrimaryConversionCycle("code-312", "label-880");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
