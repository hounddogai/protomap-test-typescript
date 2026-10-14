import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepManifest } from "./step-manifest.js";

test("StepManifest starts in planned", () => {
  const item = newStepManifest("code-723", "name-296");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepManifest moves to completed", () => {
  const item = newStepManifest("code-723", "name-296");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("StepManifest rejects moves from cancelled", () => {
  const item = newStepManifest("code-723", "name-296");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
