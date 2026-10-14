import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDomainThreshold } from "./capped-domain-threshold.js";

test("CappedDomainThreshold starts in created", () => {
  const item = newCappedDomainThreshold("code-358", "label-533");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDomainThreshold moves to retired", () => {
  const item = newCappedDomainThreshold("code-358", "label-533");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("CappedDomainThreshold rejects moves from retired", () => {
  const item = newCappedDomainThreshold("code-358", "label-533");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
