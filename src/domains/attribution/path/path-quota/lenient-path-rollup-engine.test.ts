import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientPathRollupEngine } from "./lenient-path-rollup-engine.js";
import { newLenientPathRollup } from "./lenient-path-rollup.js";

test("LenientPathRollupEngine keeps results within bounds", () => {
  const engine = defaultLenientPathRollupEngine();
  const item = newLenientPathRollup("code-120", "title-563");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
