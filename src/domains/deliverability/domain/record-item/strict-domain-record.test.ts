import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictDomainRecord } from "./strict-domain-record.js";

test("StrictDomainRecord starts in created", () => {
  const item = newStrictDomainRecord("code-146", "title-482");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictDomainRecord moves to published", () => {
  const item = newStrictDomainRecord("code-146", "title-482");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StrictDomainRecord rejects moves from retired", () => {
  const item = newStrictDomainRecord("code-146", "title-482");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
