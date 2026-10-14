import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutOverride } from "./opt-out-override.js";

test("OptOutOverride starts in requested", () => {
  const item = newOptOutOverride("code-536", "title-69");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutOverride moves to granted", () => {
  const item = newOptOutOverride("code-536", "title-69");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("OptOutOverride rejects moves from expired", () => {
  const item = newOptOutOverride("code-536", "title-69");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
