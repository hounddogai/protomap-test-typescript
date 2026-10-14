import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalLevelOverrideEngine } from "./seasonal-level-override-engine.js";
import { newSeasonalLevelOverride } from "./seasonal-level-override.js";

test("SeasonalLevelOverrideEngine keeps results within bounds", () => {
  const engine = defaultSeasonalLevelOverrideEngine(flags.newRegistry());
  const item = newSeasonalLevelOverride("code-187", "title-622");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
