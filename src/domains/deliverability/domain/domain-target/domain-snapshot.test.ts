import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainSnapshot } from "./domain-snapshot.js";

test("DomainSnapshot starts in idle", () => {
  const item = newDomainSnapshot("code-862", "label-986");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainSnapshot moves to warming", () => {
  const item = newDomainSnapshot("code-862", "label-986");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("DomainSnapshot rejects moves from stopped", () => {
  const item = newDomainSnapshot("code-862", "label-986");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
