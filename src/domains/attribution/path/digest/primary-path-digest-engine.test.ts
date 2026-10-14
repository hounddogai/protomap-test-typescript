import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryPathDigestEngine } from "./primary-path-digest-engine.js";
import { newPrimaryPathDigest } from "./primary-path-digest.js";

test("PrimaryPathDigestEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPathDigestEngine();
  const item = newPrimaryPathDigest("code-518", "label-125");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
