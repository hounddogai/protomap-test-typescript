import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutManifest } from "./opt-out-manifest.js";

test("OptOutManifest starts in created", () => {
  const item = newOptOutManifest("code-177", "name-879");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutManifest moves to validated", () => {
  const item = newOptOutManifest("code-177", "name-879");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("OptOutManifest rejects moves from retired", () => {
  const item = newOptOutManifest("code-177", "name-879");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
