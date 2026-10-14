import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSlaOverride } from "./pending-sla-override.js";

test("PendingSlaOverride starts in draft", () => {
  const item = newPendingSlaOverride("code-486", "name-764");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSlaOverride moves to suspended", () => {
  const item = newPendingSlaOverride("code-486", "name-764");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingSlaOverride rejects moves from closed", () => {
  const item = newPendingSlaOverride("code-486", "name-764");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
