import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackMacroSnapshotEngine } from "./fallback-macro-snapshot-engine.js";
import { newFallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

test("FallbackMacroSnapshotEngine keeps results within bounds", () => {
  const engine = defaultFallbackMacroSnapshotEngine(flags.newRegistry());
  const item = newFallbackMacroSnapshot("code-276", "name-545");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
