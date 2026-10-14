import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelOverrideEngine } from "./level-override-engine.js";
import { newLevelOverride } from "./level-override.js";

test("LevelOverrideEngine keeps results within bounds", () => {
  const engine = defaultLevelOverrideEngine(flags.newRegistry());
  const item = newLevelOverride("code-768", "title-878");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
