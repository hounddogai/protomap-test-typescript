import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPathSnapshot } from "./capped-path-snapshot.js";

test("CappedPathSnapshot starts in planned", () => {
  const item = newCappedPathSnapshot("code-384", "title-712");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPathSnapshot moves to scheduled", () => {
  const item = newCappedPathSnapshot("code-384", "title-712");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedPathSnapshot rejects moves from cancelled", () => {
  const item = newCappedPathSnapshot("code-384", "title-712");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
