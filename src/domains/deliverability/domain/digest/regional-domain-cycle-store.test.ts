import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalDomainCycleStore } from "./regional-domain-cycle-store.js";
import { newRegionalDomainCycle } from "./regional-domain-cycle.js";

test("MemoryRegionalDomainCycleStore finds what it saved", () => {
  const store = newMemoryRegionalDomainCycleStore();
  const item = newRegionalDomainCycle("code-32", "name-112");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
