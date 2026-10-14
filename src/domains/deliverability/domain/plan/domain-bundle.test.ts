import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainBundle } from "./domain-bundle.js";

test("DomainBundle starts in proposed", () => {
  const item = newDomainBundle("code-609", "title-176");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainBundle moves to approved", () => {
  const item = newDomainBundle("code-609", "title-176");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DomainBundle rejects moves from withdrawn", () => {
  const item = newDomainBundle("code-609", "title-176");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
