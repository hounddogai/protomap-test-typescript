import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaPlan } from "./sla-plan.js";

test("SlaPlan starts in open", () => {
  const item = newSlaPlan("code-228", "title-72");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaPlan moves to archived", () => {
  const item = newSlaPlan("code-228", "title-72");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SlaPlan rejects moves from archived", () => {
  const item = newSlaPlan("code-228", "title-72");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
