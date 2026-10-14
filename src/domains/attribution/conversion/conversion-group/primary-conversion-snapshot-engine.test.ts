import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryConversionSnapshotEngine } from "./primary-conversion-snapshot-engine.js";
import { newPrimaryConversionSnapshot } from "./primary-conversion-snapshot.js";

test("PrimaryConversionSnapshotEngine keeps results within bounds", () => {
  const engine = defaultPrimaryConversionSnapshotEngine();
  const item = newPrimaryConversionSnapshot("code-930", "label-304");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
