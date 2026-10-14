import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatAudit } from "./csat-audit.js";

test("CsatAudit starts in proposed", () => {
  const item = newCsatAudit("code-766", "title-20");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatAudit moves to withdrawn", () => {
  const item = newCsatAudit("code-766", "title-20");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("CsatAudit rejects moves from withdrawn", () => {
  const item = newCsatAudit("code-766", "title-20");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
