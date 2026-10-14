import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintManifest } from "./complaint-manifest.js";

test("ComplaintManifest starts in proposed", () => {
  const item = newComplaintManifest("code-116", "name-592");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintManifest moves to rejected", () => {
  const item = newComplaintManifest("code-116", "name-592");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ComplaintManifest rejects moves from withdrawn", () => {
  const item = newComplaintManifest("code-116", "name-592");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
