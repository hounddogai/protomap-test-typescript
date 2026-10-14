import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionClaimStore } from "./deflection-claim-store.js";
import { newDeflectionClaim } from "./deflection-claim.js";

test("MemoryDeflectionClaimStore finds what it saved", () => {
  const store = newMemoryDeflectionClaimStore();
  const item = newDeflectionClaim("code-925", "title-768");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
