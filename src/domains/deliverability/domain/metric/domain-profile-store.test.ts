import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainProfileStore } from "./domain-profile-store.js";
import { newDomainProfile } from "./domain-profile.js";

test("MemoryDomainProfileStore finds what it saved", () => {
  const store = newMemoryDomainProfileStore();
  const item = newDomainProfile("code-441", "label-962");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
