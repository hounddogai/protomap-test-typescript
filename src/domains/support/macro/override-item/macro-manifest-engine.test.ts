import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroManifestEngine } from "./macro-manifest-engine.js";
import { newMacroManifest } from "./macro-manifest.js";

test("MacroManifestEngine keeps results within bounds", () => {
  const engine = defaultMacroManifestEngine(flags.newRegistry());
  const item = newMacroManifest("code-923", "label-767");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
