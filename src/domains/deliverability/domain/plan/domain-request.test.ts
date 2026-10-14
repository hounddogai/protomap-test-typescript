import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainRequest } from "./domain-request.js";

test("DomainRequest starts in created", () => {
  const item = newDomainRequest("code-28", "title-669");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainRequest moves to validated", () => {
  const item = newDomainRequest("code-28", "title-669");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DomainRequest rejects moves from retired", () => {
  const item = newDomainRequest("code-28", "title-669");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
