import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPostRollupEngine } from "./rolling-post-rollup-engine.js";
import { newRollingPostRollup } from "./rolling-post-rollup.js";

test("RollingPostRollupEngine keeps results within bounds", () => {
  const engine = defaultRollingPostRollupEngine(flags.newRegistry());
  const item = newRollingPostRollup("code-544", "label-844");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
