import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainProfile } from "./domain-profile.js";

test("DomainProfile starts in created", () => {
  const item = newDomainProfile("code-441", "label-962");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainProfile moves to validated", () => {
  const item = newDomainProfile("code-441", "label-962");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DomainProfile rejects moves from retired", () => {
  const item = newDomainProfile("code-441", "label-962");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
