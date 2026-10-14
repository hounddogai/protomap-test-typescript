import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryMacroSnapshotEngine } from "./primary-macro-snapshot-engine.js";
import { newPrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

test("PrimaryMacroSnapshotEngine keeps results within bounds", () => {
  const engine = defaultPrimaryMacroSnapshotEngine();
  const item = newPrimaryMacroSnapshot("code-847", "name-230");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
