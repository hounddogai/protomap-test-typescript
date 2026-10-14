import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaCycle } from "./sla-cycle.js";

test("SlaCycle starts in created", () => {
  const item = newSlaCycle("code-591", "label-916");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaCycle moves to published", () => {
  const item = newSlaCycle("code-591", "label-916");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SlaCycle rejects moves from retired", () => {
  const item = newSlaCycle("code-591", "label-916");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
