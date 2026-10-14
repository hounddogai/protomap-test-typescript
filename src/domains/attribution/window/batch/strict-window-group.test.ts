import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictWindowGroup } from "./strict-window-group.js";

test("StrictWindowGroup starts in planned", () => {
  const item = newStrictWindowGroup("code-793", "label-130");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictWindowGroup moves to completed", () => {
  const item = newStrictWindowGroup("code-793", "label-130");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("StrictWindowGroup rejects moves from cancelled", () => {
  const item = newStrictWindowGroup("code-793", "label-130");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
