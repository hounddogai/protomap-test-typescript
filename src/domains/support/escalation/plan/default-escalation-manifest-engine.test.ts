import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultEscalationManifestEngine } from "./default-escalation-manifest-engine.js";
import { newDefaultEscalationManifest } from "./default-escalation-manifest.js";

test("DefaultEscalationManifestEngine keeps results within bounds", () => {
  const engine = defaultDefaultEscalationManifestEngine(flags.newRegistry());
  const item = newDefaultEscalationManifest("code-88", "label-286");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
