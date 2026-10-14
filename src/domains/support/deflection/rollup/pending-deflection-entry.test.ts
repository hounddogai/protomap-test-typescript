import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingDeflectionEntry } from "./pending-deflection-entry.js";

test("PendingDeflectionEntry starts in draft", () => {
  const item = newPendingDeflectionEntry("code-705", "name-599");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingDeflectionEntry moves to suspended", () => {
  const item = newPendingDeflectionEntry("code-705", "name-599");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingDeflectionEntry rejects moves from closed", () => {
  const item = newPendingDeflectionEntry("code-705", "name-599");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
