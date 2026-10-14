import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledMacroSnapshotEngine } from "./scheduled-macro-snapshot-engine.js";
import { newScheduledMacroSnapshot } from "./scheduled-macro-snapshot.js";

test("ScheduledMacroSnapshotEngine keeps results within bounds", () => {
  const engine = defaultScheduledMacroSnapshotEngine();
  const item = newScheduledMacroSnapshot("code-64", "label-592");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
