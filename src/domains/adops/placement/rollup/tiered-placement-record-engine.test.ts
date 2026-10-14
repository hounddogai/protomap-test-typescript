import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPlacementRecordEngine } from "./tiered-placement-record-engine.js";
import { newTieredPlacementRecord } from "./tiered-placement-record.js";

test("TieredPlacementRecordEngine keeps results within bounds", () => {
  const engine = defaultTieredPlacementRecordEngine();
  const item = newTieredPlacementRecord("code-104", "name-892");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
