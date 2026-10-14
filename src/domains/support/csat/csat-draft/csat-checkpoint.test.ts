import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatCheckpoint } from "./csat-checkpoint.js";

test("CsatCheckpoint starts in requested", () => {
  const item = newCsatCheckpoint("code-722", "name-2");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatCheckpoint moves to granted", () => {
  const item = newCsatCheckpoint("code-722", "name-2");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CsatCheckpoint rejects moves from expired", () => {
  const item = newCsatCheckpoint("code-722", "name-2");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
