import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatCycle } from "./csat-cycle.js";

test("CsatCycle starts in proposed", () => {
  const item = newCsatCycle("code-684", "name-80");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatCycle moves to rejected", () => {
  const item = newCsatCycle("code-684", "name-80");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CsatCycle rejects moves from withdrawn", () => {
  const item = newCsatCycle("code-684", "name-80");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
