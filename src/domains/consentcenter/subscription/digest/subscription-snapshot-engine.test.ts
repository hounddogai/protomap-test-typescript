import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionSnapshotEngine } from "./subscription-snapshot-engine.js";
import { newSubscriptionSnapshot } from "./subscription-snapshot.js";

test("SubscriptionSnapshotEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionSnapshotEngine(flags.newRegistry());
  const item = newSubscriptionSnapshot("code-649", "name-803");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
