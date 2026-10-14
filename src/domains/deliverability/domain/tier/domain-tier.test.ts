import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainTier } from "./domain-tier.js";

test("DomainTier starts in draft", () => {
  const item = newDomainTier("code-409", "label-973");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainTier moves to pending", () => {
  const item = newDomainTier("code-409", "label-973");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DomainTier rejects moves from closed", () => {
  const item = newDomainTier("code-409", "label-973");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
