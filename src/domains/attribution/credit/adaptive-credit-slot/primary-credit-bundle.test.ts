import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryCreditBundle } from "./primary-credit-bundle.js";

test("PrimaryCreditBundle starts in open", () => {
  const item = newPrimaryCreditBundle("code-803", "name-151");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryCreditBundle moves to in review", () => {
  const item = newPrimaryCreditBundle("code-803", "name-151");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PrimaryCreditBundle rejects moves from archived", () => {
  const item = newPrimaryCreditBundle("code-803", "name-151");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
