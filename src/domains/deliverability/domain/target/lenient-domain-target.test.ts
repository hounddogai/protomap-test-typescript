import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDomainTarget } from "./lenient-domain-target.js";

test("LenientDomainTarget starts in created", () => {
  const item = newLenientDomainTarget("code-527", "label-883");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDomainTarget moves to retired", () => {
  const item = newLenientDomainTarget("code-527", "label-883");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LenientDomainTarget rejects moves from retired", () => {
  const item = newLenientDomainTarget("code-527", "label-883");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
