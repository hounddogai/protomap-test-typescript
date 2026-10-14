import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeAudit } from "./creative-audit.js";

test("CreativeAudit starts in proposed", () => {
  const item = newCreativeAudit("code-723", "label-76");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeAudit moves to approved", () => {
  const item = newCreativeAudit("code-723", "label-76");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CreativeAudit rejects moves from withdrawn", () => {
  const item = newCreativeAudit("code-723", "label-76");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
