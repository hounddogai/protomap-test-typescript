import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientFunnelClaimStore } from "./lenient-funnel-claim-store.js";
import { newLenientFunnelClaim } from "./lenient-funnel-claim.js";

test("MemoryLenientFunnelClaimStore finds what it saved", () => {
  const store = newMemoryLenientFunnelClaimStore();
  const item = newLenientFunnelClaim("code-483", "label-825");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
