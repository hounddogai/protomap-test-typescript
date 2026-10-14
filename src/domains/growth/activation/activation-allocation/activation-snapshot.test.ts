import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationSnapshot } from "./activation-snapshot.js";

test("ActivationSnapshot starts in created", () => {
  const item = newActivationSnapshot("code-738", "title-647");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationSnapshot moves to validated", () => {
  const item = newActivationSnapshot("code-738", "title-647");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ActivationSnapshot rejects moves from retired", () => {
  const item = newActivationSnapshot("code-738", "title-647");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
