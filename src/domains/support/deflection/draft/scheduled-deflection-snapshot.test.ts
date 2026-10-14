import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDeflectionSnapshot } from "./scheduled-deflection-snapshot.js";

test("ScheduledDeflectionSnapshot starts in draft", () => {
  const item = newScheduledDeflectionSnapshot("code-908", "name-603");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDeflectionSnapshot moves to pending", () => {
  const item = newScheduledDeflectionSnapshot("code-908", "name-603");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ScheduledDeflectionSnapshot rejects moves from closed", () => {
  const item = newScheduledDeflectionSnapshot("code-908", "name-603");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
