import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeQuota } from "./creative-quota.js";

test("CreativeQuota starts in idle", () => {
  const item = newCreativeQuota("code-780", "name-913");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeQuota moves to ready", () => {
  const item = newCreativeQuota("code-780", "name-913");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CreativeQuota rejects moves from stopped", () => {
  const item = newCreativeQuota("code-780", "name-913");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
