import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightManifest } from "./flight-manifest.js";

test("FlightManifest starts in planned", () => {
  const item = newFlightManifest("code-358", "label-858");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightManifest moves to scheduled", () => {
  const item = newFlightManifest("code-358", "label-858");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FlightManifest rejects moves from cancelled", () => {
  const item = newFlightManifest("code-358", "label-858");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
