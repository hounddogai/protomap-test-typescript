import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingDoubleOptInRecord } from "./rolling-double-opt-in-record.js";

test("RollingDoubleOptInRecord starts in planned", () => {
  const item = newRollingDoubleOptInRecord("code-23", "name-577");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingDoubleOptInRecord moves to in progress", () => {
  const item = newRollingDoubleOptInRecord("code-23", "name-577");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingDoubleOptInRecord rejects moves from cancelled", () => {
  const item = newRollingDoubleOptInRecord("code-23", "name-577");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
