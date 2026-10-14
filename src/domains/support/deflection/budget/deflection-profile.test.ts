import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionProfile } from "./deflection-profile.js";

test("DeflectionProfile starts in idle", () => {
  const item = newDeflectionProfile("code-926", "name-52");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionProfile moves to warming", () => {
  const item = newDeflectionProfile("code-926", "name-52");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("DeflectionProfile rejects moves from stopped", () => {
  const item = newDeflectionProfile("code-926", "name-52");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
