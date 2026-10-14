import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryDomainMapping } from "./primary-domain-mapping.js";

test("PrimaryDomainMapping starts in open", () => {
  const item = newPrimaryDomainMapping("code-750", "title-240");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryDomainMapping moves to resolved", () => {
  const item = newPrimaryDomainMapping("code-750", "title-240");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PrimaryDomainMapping rejects moves from archived", () => {
  const item = newPrimaryDomainMapping("code-750", "title-240");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
