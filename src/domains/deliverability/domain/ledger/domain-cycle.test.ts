import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainCycle } from "./domain-cycle.js";

test("DomainCycle starts in draft", () => {
  const item = newDomainCycle("code-707", "name-32");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainCycle moves to suspended", () => {
  const item = newDomainCycle("code-707", "name-32");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("DomainCycle rejects moves from closed", () => {
  const item = newDomainCycle("code-707", "name-32");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
