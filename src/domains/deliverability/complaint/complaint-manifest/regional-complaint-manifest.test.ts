import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalComplaintManifest } from "./regional-complaint-manifest.js";

test("RegionalComplaintManifest starts in open", () => {
  const item = newRegionalComplaintManifest("code-247", "label-241");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalComplaintManifest moves to resolved", () => {
  const item = newRegionalComplaintManifest("code-247", "label-241");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalComplaintManifest rejects moves from archived", () => {
  const item = newRegionalComplaintManifest("code-247", "label-241");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
