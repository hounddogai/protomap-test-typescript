import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveDomainSnapshotEngine } from "./adaptive-domain-snapshot-engine.js";
import { newAdaptiveDomainSnapshot } from "./adaptive-domain-snapshot.js";

test("AdaptiveDomainSnapshotEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDomainSnapshotEngine();
  const item = newAdaptiveDomainSnapshot("code-239", "label-75");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
