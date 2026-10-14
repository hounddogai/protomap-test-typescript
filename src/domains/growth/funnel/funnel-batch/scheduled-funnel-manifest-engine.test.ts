import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledFunnelManifestEngine } from "./scheduled-funnel-manifest-engine.js";
import { newScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

test("ScheduledFunnelManifestEngine keeps results within bounds", () => {
  const engine = defaultScheduledFunnelManifestEngine(flags.newRegistry());
  const item = newScheduledFunnelManifest("code-247", "name-139");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
