import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedDomainSnapshotEngine } from "./weighted-domain-snapshot-engine.js";
import { newWeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

test("WeightedDomainSnapshotEngine keeps results within bounds", () => {
  const engine = defaultWeightedDomainSnapshotEngine(flags.newRegistry());
  const item = newWeightedDomainSnapshot("code-165", "title-934");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
