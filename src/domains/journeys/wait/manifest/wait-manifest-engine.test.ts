import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitManifestEngine } from "./wait-manifest-engine.js";
import { newWaitManifest } from "./wait-manifest.js";

test("WaitManifestEngine keeps results within bounds", () => {
  const engine = defaultWaitManifestEngine(flags.newRegistry());
  const item = newWaitManifest("code-388", "title-699");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
