import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationEntry } from "./activation-entry.js";

test("ActivationEntry starts in requested", () => {
  const item = newActivationEntry("code-926", "name-407");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationEntry moves to granted", () => {
  const item = newActivationEntry("code-926", "name-407");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ActivationEntry rejects moves from expired", () => {
  const item = newActivationEntry("code-926", "name-407");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
