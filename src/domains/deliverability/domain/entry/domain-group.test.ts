import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainGroup } from "./domain-group.js";

test("DomainGroup starts in planned", () => {
  const item = newDomainGroup("code-641", "label-219");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainGroup moves to completed", () => {
  const item = newDomainGroup("code-641", "label-219");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("DomainGroup rejects moves from cancelled", () => {
  const item = newDomainGroup("code-641", "label-219");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
