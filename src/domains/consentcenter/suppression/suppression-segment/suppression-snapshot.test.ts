import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionSnapshot } from "./suppression-snapshot.js";

test("SuppressionSnapshot starts in requested", () => {
  const item = newSuppressionSnapshot("code-161", "label-543");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionSnapshot moves to granted", () => {
  const item = newSuppressionSnapshot("code-161", "label-543");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SuppressionSnapshot rejects moves from expired", () => {
  const item = newSuppressionSnapshot("code-161", "label-543");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
