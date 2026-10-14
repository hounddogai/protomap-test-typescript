import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalDomainGroupStore } from "./seasonal-domain-group-store.js";
import { newSeasonalDomainGroup } from "./seasonal-domain-group.js";

test("MemorySeasonalDomainGroupStore finds what it saved", () => {
  const store = newMemorySeasonalDomainGroupStore();
  const item = newSeasonalDomainGroup("code-733", "title-448");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
