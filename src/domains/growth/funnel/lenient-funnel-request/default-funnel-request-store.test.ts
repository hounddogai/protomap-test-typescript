import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFunnelRequestStore } from "./default-funnel-request-store.js";
import { newDefaultFunnelRequest } from "./default-funnel-request.js";

test("MemoryDefaultFunnelRequestStore finds what it saved", () => {
  const store = newMemoryDefaultFunnelRequestStore();
  const item = newDefaultFunnelRequest("code-502", "label-39");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
