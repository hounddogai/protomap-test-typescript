import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInRule } from "./double-opt-in-rule.js";

test("DoubleOptInRule starts in new", () => {
  const item = newDoubleOptInRule("code-128", "name-91");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInRule moves to done", () => {
  const item = newDoubleOptInRule("code-128", "name-91");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DoubleOptInRule rejects moves from failed", () => {
  const item = newDoubleOptInRule("code-128", "name-91");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
