import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainBaseline } from "./domain-baseline.js";

test("DomainBaseline starts in proposed", () => {
  const item = newDomainBaseline("code-775", "title-209");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainBaseline moves to approved", () => {
  const item = newDomainBaseline("code-775", "title-209");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DomainBaseline rejects moves from withdrawn", () => {
  const item = newDomainBaseline("code-775", "title-209");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
