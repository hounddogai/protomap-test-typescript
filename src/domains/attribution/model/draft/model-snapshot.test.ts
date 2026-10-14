import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelSnapshot } from "./model-snapshot.js";

test("ModelSnapshot starts in new", () => {
  const item = newModelSnapshot("code-628", "label-60");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelSnapshot moves to running", () => {
  const item = newModelSnapshot("code-628", "label-60");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ModelSnapshot rejects moves from failed", () => {
  const item = newModelSnapshot("code-628", "label-60");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
