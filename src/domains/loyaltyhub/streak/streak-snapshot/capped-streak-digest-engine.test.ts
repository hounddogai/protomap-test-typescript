import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedStreakDigestEngine } from "./capped-streak-digest-engine.js";
import { newCappedStreakDigest } from "./capped-streak-digest.js";

test("CappedStreakDigestEngine keeps results within bounds", () => {
  const engine = defaultCappedStreakDigestEngine();
  const item = newCappedStreakDigest("code-978", "title-507");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
