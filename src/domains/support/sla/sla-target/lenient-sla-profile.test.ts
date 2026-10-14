import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSlaProfile } from "./lenient-sla-profile.js";

test("LenientSlaProfile starts in created", () => {
  const item = newLenientSlaProfile("code-210", "name-188");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSlaProfile moves to validated", () => {
  const item = newLenientSlaProfile("code-210", "name-188");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LenientSlaProfile rejects moves from retired", () => {
  const item = newLenientSlaProfile("code-210", "name-188");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
