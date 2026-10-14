import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalFunnelRequestStore } from "./regional-funnel-request-store.js";
import { newRegionalFunnelRequest } from "./regional-funnel-request.js";

test("MemoryRegionalFunnelRequestStore finds what it saved", () => {
  const store = newMemoryRegionalFunnelRequestStore();
  const item = newRegionalFunnelRequest("code-868", "title-809");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
