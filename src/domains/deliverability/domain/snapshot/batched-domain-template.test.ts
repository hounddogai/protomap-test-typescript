import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDomainTemplate } from "./batched-domain-template.js";

test("BatchedDomainTemplate starts in idle", () => {
  const item = newBatchedDomainTemplate("code-43", "label-282");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDomainTemplate moves to stopped", () => {
  const item = newBatchedDomainTemplate("code-43", "label-282");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BatchedDomainTemplate rejects moves from stopped", () => {
  const item = newBatchedDomainTemplate("code-43", "label-282");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
