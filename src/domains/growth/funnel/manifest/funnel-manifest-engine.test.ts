import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelManifestEngine } from "./funnel-manifest-engine.js";
import { newFunnelManifest } from "./funnel-manifest.js";

test("FunnelManifestEngine keeps results within bounds", () => {
  const engine = defaultFunnelManifestEngine(flags.newRegistry());
  const item = newFunnelManifest("code-399", "label-262");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
