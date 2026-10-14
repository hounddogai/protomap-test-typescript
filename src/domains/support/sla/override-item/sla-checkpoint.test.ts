import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaCheckpoint } from "./sla-checkpoint.js";

test("SlaCheckpoint starts in created", () => {
  const item = newSlaCheckpoint("code-615", "label-477");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaCheckpoint moves to validated", () => {
  const item = newSlaCheckpoint("code-615", "label-477");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SlaCheckpoint rejects moves from retired", () => {
  const item = newSlaCheckpoint("code-615", "label-477");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
