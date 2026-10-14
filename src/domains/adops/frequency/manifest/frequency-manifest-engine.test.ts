import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencyManifestEngine } from "./frequency-manifest-engine.js";
import { newFrequencyManifest } from "./frequency-manifest.js";

test("FrequencyManifestEngine keeps results within bounds", () => {
  const engine = defaultFrequencyManifestEngine(flags.newRegistry());
  const item = newFrequencyManifest("code-221", "title-19");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
