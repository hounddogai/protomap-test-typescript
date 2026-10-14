import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainEstimate } from "./domain-estimate.js";

test("DomainEstimate starts in draft", () => {
  const item = newDomainEstimate("code-992", "label-515");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainEstimate moves to suspended", () => {
  const item = newDomainEstimate("code-992", "label-515");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("DomainEstimate rejects moves from closed", () => {
  const item = newDomainEstimate("code-992", "label-515");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
