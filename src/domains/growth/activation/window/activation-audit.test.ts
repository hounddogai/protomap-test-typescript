import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationAudit } from "./activation-audit.js";

test("ActivationAudit starts in proposed", () => {
  const item = newActivationAudit("code-46", "title-527");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationAudit moves to approved", () => {
  const item = newActivationAudit("code-46", "title-527");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ActivationAudit rejects moves from withdrawn", () => {
  const item = newActivationAudit("code-46", "title-527");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
