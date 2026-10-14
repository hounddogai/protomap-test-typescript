import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

test("TieredNudgeSnapshot starts in draft", () => {
  const item = newTieredNudgeSnapshot("code-179", "title-531");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredNudgeSnapshot moves to active", () => {
  const item = newTieredNudgeSnapshot("code-179", "title-531");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TieredNudgeSnapshot rejects moves from closed", () => {
  const item = newTieredNudgeSnapshot("code-179", "title-531");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
