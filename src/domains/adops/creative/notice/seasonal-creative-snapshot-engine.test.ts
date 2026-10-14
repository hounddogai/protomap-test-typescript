import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalCreativeSnapshotEngine } from "./seasonal-creative-snapshot-engine.js";
import { newSeasonalCreativeSnapshot } from "./seasonal-creative-snapshot.js";

test("SeasonalCreativeSnapshotEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCreativeSnapshotEngine(flags.newRegistry());
  const item = newSeasonalCreativeSnapshot("code-790", "title-30");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
