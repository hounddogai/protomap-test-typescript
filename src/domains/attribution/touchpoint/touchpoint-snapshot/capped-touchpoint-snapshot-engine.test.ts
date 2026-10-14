import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedTouchpointSnapshotEngine } from "./capped-touchpoint-snapshot-engine.js";
import { newCappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

test("CappedTouchpointSnapshotEngine keeps results within bounds", () => {
  const engine = defaultCappedTouchpointSnapshotEngine(flags.newRegistry());
  const item = newCappedTouchpointSnapshot("code-873", "title-654");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
