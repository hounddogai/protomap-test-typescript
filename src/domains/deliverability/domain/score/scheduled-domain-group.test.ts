import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDomainGroup } from "./scheduled-domain-group.js";

test("ScheduledDomainGroup starts in created", () => {
  const item = newScheduledDomainGroup("code-588", "name-953");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDomainGroup moves to retired", () => {
  const item = newScheduledDomainGroup("code-588", "name-953");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ScheduledDomainGroup rejects moves from retired", () => {
  const item = newScheduledDomainGroup("code-588", "name-953");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
