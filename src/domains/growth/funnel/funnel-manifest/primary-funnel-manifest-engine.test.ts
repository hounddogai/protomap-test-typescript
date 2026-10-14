import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryFunnelManifestEngine } from "./primary-funnel-manifest-engine.js";
import { newPrimaryFunnelManifest } from "./primary-funnel-manifest.js";

test("PrimaryFunnelManifestEngine keeps results within bounds", () => {
  const engine = defaultPrimaryFunnelManifestEngine(flags.newRegistry());
  const item = newPrimaryFunnelManifest("code-62", "label-148");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
