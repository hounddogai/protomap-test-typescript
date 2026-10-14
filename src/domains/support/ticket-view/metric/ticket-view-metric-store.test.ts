import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewMetricStore } from "./ticket-view-metric-store.js";
import { newTicketViewMetric } from "./ticket-view-metric.js";

test("MemoryTicketViewMetricStore finds what it saved", () => {
  const store = newMemoryTicketViewMetricStore();
  const item = newTicketViewMetric("code-52", "title-792");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
