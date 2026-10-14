import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowManifestEngine } from "./window-manifest-engine.js";
import { newWindowManifest } from "./window-manifest.js";

test("WindowManifestEngine keeps results within bounds", () => {
  const engine = defaultWindowManifestEngine(flags.newRegistry());
  const item = newWindowManifest("code-447", "title-356");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
