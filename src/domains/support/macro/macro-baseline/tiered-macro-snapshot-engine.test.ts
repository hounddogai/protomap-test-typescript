import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredMacroSnapshotEngine } from "./tiered-macro-snapshot-engine.js";
import { newTieredMacroSnapshot } from "./tiered-macro-snapshot.js";

test("TieredMacroSnapshotEngine keeps results within bounds", () => {
  const engine = defaultTieredMacroSnapshotEngine(flags.newRegistry());
  const item = newTieredMacroSnapshot("code-450", "name-767");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
