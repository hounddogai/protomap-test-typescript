import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySenderRule } from "./primary-sender-rule.js";

test("PrimarySenderRule starts in open", () => {
  const item = newPrimarySenderRule("code-630", "title-151");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySenderRule moves to archived", () => {
  const item = newPrimarySenderRule("code-630", "title-151");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PrimarySenderRule rejects moves from archived", () => {
  const item = newPrimarySenderRule("code-630", "title-151");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
