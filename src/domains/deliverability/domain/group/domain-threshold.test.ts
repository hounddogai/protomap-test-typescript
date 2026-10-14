import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainThreshold } from "./domain-threshold.js";

test("DomainThreshold starts in new", () => {
  const item = newDomainThreshold("code-288", "label-361");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainThreshold moves to running", () => {
  const item = newDomainThreshold("code-288", "label-361");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DomainThreshold rejects moves from failed", () => {
  const item = newDomainThreshold("code-288", "label-361");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
