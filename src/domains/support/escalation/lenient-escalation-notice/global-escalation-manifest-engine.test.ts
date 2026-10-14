import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalEscalationManifestEngine } from "./global-escalation-manifest-engine.js";
import { newGlobalEscalationManifest } from "./global-escalation-manifest.js";

test("GlobalEscalationManifestEngine keeps results within bounds", () => {
  const engine = defaultGlobalEscalationManifestEngine(flags.newRegistry());
  const item = newGlobalEscalationManifest("code-410", "label-333");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
