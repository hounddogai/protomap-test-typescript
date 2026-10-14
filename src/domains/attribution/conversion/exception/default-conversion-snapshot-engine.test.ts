import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultConversionSnapshotEngine } from "./default-conversion-snapshot-engine.js";
import { newDefaultConversionSnapshot } from "./default-conversion-snapshot.js";

test("DefaultConversionSnapshotEngine keeps results within bounds", () => {
  const engine = defaultDefaultConversionSnapshotEngine(flags.newRegistry());
  const item = newDefaultConversionSnapshot("code-144", "name-363");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
