import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelRollupEngine } from "./level-rollup-engine.js";
import { newLevelRollup } from "./level-rollup.js";

test("LevelRollupEngine keeps results within bounds", () => {
  const engine = defaultLevelRollupEngine(flags.newRegistry());
  const item = newLevelRollup("code-623", "label-639");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
