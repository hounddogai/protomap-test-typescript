import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainCheckpoint } from "./domain-checkpoint.js";

test("DomainCheckpoint starts in open", () => {
  const item = newDomainCheckpoint("code-696", "name-997");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainCheckpoint moves to archived", () => {
  const item = newDomainCheckpoint("code-696", "name-997");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("DomainCheckpoint rejects moves from archived", () => {
  const item = newDomainCheckpoint("code-696", "name-997");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
