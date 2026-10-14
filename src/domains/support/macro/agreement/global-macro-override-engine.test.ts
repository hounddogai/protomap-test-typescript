import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalMacroOverrideEngine } from "./global-macro-override-engine.js";
import { newGlobalMacroOverride } from "./global-macro-override.js";

test("GlobalMacroOverrideEngine keeps results within bounds", () => {
  const engine = defaultGlobalMacroOverrideEngine();
  const item = newGlobalMacroOverride("code-194", "label-578");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
