import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelCheckpoint } from "./model-checkpoint.js";

test("ModelCheckpoint starts in open", () => {
  const item = newModelCheckpoint("code-236", "label-905");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelCheckpoint moves to reopened", () => {
  const item = newModelCheckpoint("code-236", "label-905");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ModelCheckpoint rejects moves from archived", () => {
  const item = newModelCheckpoint("code-236", "label-905");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
