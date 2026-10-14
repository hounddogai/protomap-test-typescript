import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultMacroOverrideEngine } from "./default-macro-override-engine.js";
import { newDefaultMacroOverride } from "./default-macro-override.js";

test("DefaultMacroOverrideEngine keeps results within bounds", () => {
  const engine = defaultDefaultMacroOverrideEngine(flags.newRegistry());
  const item = newDefaultMacroOverride("code-491", "title-953");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
