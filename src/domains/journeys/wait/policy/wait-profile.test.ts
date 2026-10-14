import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitProfile } from "./wait-profile.js";

test("WaitProfile starts in proposed", () => {
  const item = newWaitProfile("code-301", "name-318");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitProfile moves to rejected", () => {
  const item = newWaitProfile("code-301", "name-318");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WaitProfile rejects moves from withdrawn", () => {
  const item = newWaitProfile("code-301", "name-318");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
