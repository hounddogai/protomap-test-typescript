import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencySnapshotEngine } from "./frequency-snapshot-engine.js";
import { newFrequencySnapshot } from "./frequency-snapshot.js";

test("FrequencySnapshotEngine keeps results within bounds", () => {
  const engine = defaultFrequencySnapshotEngine(flags.newRegistry());
  const item = newFrequencySnapshot("code-385", "title-477");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
