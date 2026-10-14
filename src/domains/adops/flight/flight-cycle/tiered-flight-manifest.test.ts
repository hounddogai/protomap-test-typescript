import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFlightManifest } from "./tiered-flight-manifest.js";

test("TieredFlightManifest starts in created", () => {
  const item = newTieredFlightManifest("code-716", "name-203");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFlightManifest moves to validated", () => {
  const item = newTieredFlightManifest("code-716", "name-203");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredFlightManifest rejects moves from retired", () => {
  const item = newTieredFlightManifest("code-716", "name-203");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
