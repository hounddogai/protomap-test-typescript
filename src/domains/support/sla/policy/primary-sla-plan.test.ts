import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySlaPlan } from "./primary-sla-plan.js";

test("PrimarySlaPlan starts in created", () => {
  const item = newPrimarySlaPlan("code-409", "name-505");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySlaPlan moves to published", () => {
  const item = newPrimarySlaPlan("code-409", "name-505");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimarySlaPlan rejects moves from retired", () => {
  const item = newPrimarySlaPlan("code-409", "name-505");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
