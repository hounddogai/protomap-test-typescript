import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDomainRequest } from "./lenient-domain-request.js";

test("LenientDomainRequest starts in open", () => {
  const item = newLenientDomainRequest("code-31", "name-633");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDomainRequest moves to archived", () => {
  const item = newLenientDomainRequest("code-31", "name-633");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("LenientDomainRequest rejects moves from archived", () => {
  const item = newLenientDomainRequest("code-31", "name-633");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
