import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainDraft } from "./domain-draft.js";

test("DomainDraft starts in planned", () => {
  const item = newDomainDraft("code-151", "label-973");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainDraft moves to in progress", () => {
  const item = newDomainDraft("code-151", "label-973");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DomainDraft rejects moves from cancelled", () => {
  const item = newDomainDraft("code-151", "label-973");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
