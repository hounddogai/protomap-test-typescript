import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainTemplate } from "./domain-template.js";

test("DomainTemplate starts in open", () => {
  const item = newDomainTemplate("code-453", "label-311");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainTemplate moves to archived", () => {
  const item = newDomainTemplate("code-453", "label-311");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("DomainTemplate rejects moves from archived", () => {
  const item = newDomainTemplate("code-453", "label-311");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
