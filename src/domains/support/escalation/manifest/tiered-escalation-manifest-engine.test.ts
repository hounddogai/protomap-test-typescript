import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredEscalationManifestEngine } from "./tiered-escalation-manifest-engine.js";
import { newTieredEscalationManifest } from "./tiered-escalation-manifest.js";

test("TieredEscalationManifestEngine keeps results within bounds", () => {
  const engine = defaultTieredEscalationManifestEngine(flags.newRegistry());
  const item = newTieredEscalationManifest("code-966", "label-140");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
