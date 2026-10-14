import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultMacroSnapshotEngine } from "./default-macro-snapshot-engine.js";
import { newDefaultMacroSnapshot } from "./default-macro-snapshot.js";

test("DefaultMacroSnapshotEngine keeps results within bounds", () => {
  const engine = defaultDefaultMacroSnapshotEngine(flags.newRegistry());
  const item = newDefaultMacroSnapshot("code-152", "name-923");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
