import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPostTemplate } from "./scheduled-post-template.js";

test("ScheduledPostTemplate starts in draft", () => {
  const item = newScheduledPostTemplate("code-908", "label-671");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPostTemplate moves to suspended", () => {
  const item = newScheduledPostTemplate("code-908", "label-671");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ScheduledPostTemplate rejects moves from closed", () => {
  const item = newScheduledPostTemplate("code-908", "label-671");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
