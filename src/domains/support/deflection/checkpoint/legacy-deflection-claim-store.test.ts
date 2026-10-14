import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDeflectionClaimStore } from "./legacy-deflection-claim-store.js";
import { newLegacyDeflectionClaim } from "./legacy-deflection-claim.js";

test("MemoryLegacyDeflectionClaimStore finds what it saved", () => {
  const store = newMemoryLegacyDeflectionClaimStore();
  const item = newLegacyDeflectionClaim("code-55", "label-351");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
