import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalMacroDigestEngine } from "./global-macro-digest-engine.js";
import { newGlobalMacroDigest } from "./global-macro-digest.js";

test("GlobalMacroDigestEngine keeps results within bounds", () => {
  const engine = defaultGlobalMacroDigestEngine();
  const item = newGlobalMacroDigest("code-375", "name-785");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
