import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryActivationDigestEngine } from "./primary-activation-digest-engine.js";
import { newPrimaryActivationDigest } from "./primary-activation-digest.js";

test("PrimaryActivationDigestEngine keeps results within bounds", () => {
  const engine = defaultPrimaryActivationDigestEngine(flags.newRegistry());
  const item = newPrimaryActivationDigest("code-3", "title-989");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
