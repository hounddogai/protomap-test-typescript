import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationDigestEngine } from "./activation-digest-engine.js";
import { newActivationDigest } from "./activation-digest.js";

test("ActivationDigestEngine keeps results within bounds", () => {
  const engine = defaultActivationDigestEngine();
  const item = newActivationDigest("code-157", "title-940");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
