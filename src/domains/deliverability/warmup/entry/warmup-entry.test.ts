import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupEntry } from "./warmup-entry.js";

test("WarmupEntry starts in proposed", () => {
  const item = newWarmupEntry("code-721", "title-771");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupEntry moves to approved", () => {
  const item = newWarmupEntry("code-721", "title-771");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WarmupEntry rejects moves from withdrawn", () => {
  const item = newWarmupEntry("code-721", "title-771");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
