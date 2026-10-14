import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationSlot } from "./activation-slot.js";

test("ActivationSlot starts in proposed", () => {
  const item = newActivationSlot("code-697", "name-444");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationSlot moves to withdrawn", () => {
  const item = newActivationSlot("code-697", "name-444");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ActivationSlot rejects moves from withdrawn", () => {
  const item = newActivationSlot("code-697", "name-444");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
