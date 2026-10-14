import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainVarianceStore } from "./domain-variance-store.js";
import { newDomainVariance } from "./domain-variance.js";

test("MemoryDomainVarianceStore finds what it saved", () => {
  const store = newMemoryDomainVarianceStore();
  const item = newDomainVariance("code-138", "title-977");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
