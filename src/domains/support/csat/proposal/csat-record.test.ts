import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatRecord } from "./csat-record.js";

test("CsatRecord starts in created", () => {
  const item = newCsatRecord("code-645", "title-678");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatRecord moves to validated", () => {
  const item = newCsatRecord("code-645", "title-678");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CsatRecord rejects moves from retired", () => {
  const item = newCsatRecord("code-645", "title-678");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
