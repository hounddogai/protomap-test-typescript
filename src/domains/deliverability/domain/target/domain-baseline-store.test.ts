import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainBaselineStore } from "./domain-baseline-store.js";
import { newDomainBaseline } from "./domain-baseline.js";

test("MemoryDomainBaselineStore finds what it saved", () => {
  const store = newMemoryDomainBaselineStore();
  const item = newDomainBaseline("code-775", "title-209");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
