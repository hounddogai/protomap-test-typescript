import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultActivationTarget } from "./default-activation-target.js";

test("DefaultActivationTarget starts in planned", () => {
  const item = newDefaultActivationTarget("code-691", "label-153");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultActivationTarget moves to scheduled", () => {
  const item = newDefaultActivationTarget("code-691", "label-153");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultActivationTarget rejects moves from cancelled", () => {
  const item = newDefaultActivationTarget("code-691", "label-153");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
