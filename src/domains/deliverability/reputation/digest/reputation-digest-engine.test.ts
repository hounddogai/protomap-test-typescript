import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationDigestEngine } from "./reputation-digest-engine.js";
import { newReputationDigest } from "./reputation-digest.js";

test("ReputationDigestEngine keeps results within bounds", () => {
  const engine = defaultReputationDigestEngine(flags.newRegistry());
  const item = newReputationDigest("code-578", "label-682");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
