import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathSnapshot } from "./path-snapshot.js";

test("PathSnapshot starts in proposed", () => {
  const item = newPathSnapshot("code-544", "label-620");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathSnapshot moves to approved", () => {
  const item = newPathSnapshot("code-544", "label-620");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PathSnapshot rejects moves from withdrawn", () => {
  const item = newPathSnapshot("code-544", "label-620");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
