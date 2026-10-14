import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainPreference } from "./domain-preference.js";

test("DomainPreference starts in created", () => {
  const item = newDomainPreference("code-731", "label-746");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainPreference moves to retired", () => {
  const item = newDomainPreference("code-731", "label-746");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("DomainPreference rejects moves from retired", () => {
  const item = newDomainPreference("code-731", "label-746");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
