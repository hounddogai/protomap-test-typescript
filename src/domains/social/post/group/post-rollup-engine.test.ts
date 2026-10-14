import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostRollupEngine } from "./post-rollup-engine.js";
import { newPostRollup } from "./post-rollup.js";

test("PostRollupEngine keeps results within bounds", () => {
  const engine = defaultPostRollupEngine(flags.newRegistry());
  const item = newPostRollup("code-120", "name-676");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
