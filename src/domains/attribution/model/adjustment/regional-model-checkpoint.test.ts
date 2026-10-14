import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalModelCheckpoint } from "./regional-model-checkpoint.js";

test("RegionalModelCheckpoint starts in open", () => {
  const item = newRegionalModelCheckpoint("code-950", "title-416");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalModelCheckpoint moves to reopened", () => {
  const item = newRegionalModelCheckpoint("code-950", "title-416");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RegionalModelCheckpoint rejects moves from archived", () => {
  const item = newRegionalModelCheckpoint("code-950", "title-416");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
