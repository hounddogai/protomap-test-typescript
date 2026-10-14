import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBounceCycle } from "./strict-bounce-cycle.js";

test("StrictBounceCycle starts in planned", () => {
  const item = newStrictBounceCycle("code-961", "name-664");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBounceCycle moves to cancelled", () => {
  const item = newStrictBounceCycle("code-961", "name-664");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("StrictBounceCycle rejects moves from cancelled", () => {
  const item = newStrictBounceCycle("code-961", "name-664");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
