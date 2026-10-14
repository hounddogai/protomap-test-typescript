import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostBaselineEngine } from "./post-baseline-engine.js";
import { newPostBaseline } from "./post-baseline.js";

test("PostBaselineEngine keeps results within bounds", () => {
  const engine = defaultPostBaselineEngine(flags.newRegistry());
  const item = newPostBaseline("code-459", "title-154");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
