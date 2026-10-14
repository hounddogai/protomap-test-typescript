import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalDeflectionRecord } from "./regional-deflection-record.js";

test("RegionalDeflectionRecord starts in proposed", () => {
  const item = newRegionalDeflectionRecord("code-841", "label-541");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalDeflectionRecord moves to rejected", () => {
  const item = newRegionalDeflectionRecord("code-841", "label-541");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalDeflectionRecord rejects moves from withdrawn", () => {
  const item = newRegionalDeflectionRecord("code-841", "label-541");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
