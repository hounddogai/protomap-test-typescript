import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCsatRecord } from "./default-csat-record.js";

test("DefaultCsatRecord starts in planned", () => {
  const item = newDefaultCsatRecord("code-911", "title-381");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCsatRecord moves to scheduled", () => {
  const item = newDefaultCsatRecord("code-911", "title-381");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultCsatRecord rejects moves from cancelled", () => {
  const item = newDefaultCsatRecord("code-911", "title-381");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
