import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictInviteMetricStore } from "./strict-invite-metric-store.js";
import { newStrictInviteMetric } from "./strict-invite-metric.js";

test("MemoryStrictInviteMetricStore finds what it saved", () => {
  const store = newMemoryStrictInviteMetricStore();
  const item = newStrictInviteMetric("code-466", "name-267");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
