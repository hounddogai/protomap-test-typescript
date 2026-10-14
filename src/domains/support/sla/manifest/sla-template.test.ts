import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaTemplate } from "./sla-template.js";

test("SlaTemplate starts in new", () => {
  const item = newSlaTemplate("code-698", "label-321");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaTemplate moves to done", () => {
  const item = newSlaTemplate("code-698", "label-321");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("SlaTemplate rejects moves from failed", () => {
  const item = newSlaTemplate("code-698", "label-321");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
