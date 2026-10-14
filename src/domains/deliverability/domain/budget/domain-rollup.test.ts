import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainRollup } from "./domain-rollup.js";

test("DomainRollup starts in new", () => {
  const item = newDomainRollup("code-630", "label-417");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainRollup moves to running", () => {
  const item = newDomainRollup("code-630", "label-417");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DomainRollup rejects moves from failed", () => {
  const item = newDomainRollup("code-630", "label-417");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
