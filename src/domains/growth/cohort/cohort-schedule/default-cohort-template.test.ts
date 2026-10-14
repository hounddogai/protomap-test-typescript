import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCohortTemplate } from "./default-cohort-template.js";

test("DefaultCohortTemplate starts in new", () => {
  const item = newDefaultCohortTemplate("code-863", "name-508");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCohortTemplate moves to done", () => {
  const item = newDefaultCohortTemplate("code-863", "name-508");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DefaultCohortTemplate rejects moves from failed", () => {
  const item = newDefaultCohortTemplate("code-863", "name-508");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
