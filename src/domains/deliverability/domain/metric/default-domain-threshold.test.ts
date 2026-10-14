import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultDomainThreshold } from "./default-domain-threshold.js";

test("DefaultDomainThreshold starts in idle", () => {
  const item = newDefaultDomainThreshold("code-368", "title-56");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultDomainThreshold moves to warming", () => {
  const item = newDefaultDomainThreshold("code-368", "title-56");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("DefaultDomainThreshold rejects moves from stopped", () => {
  const item = newDefaultDomainThreshold("code-368", "title-56");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
