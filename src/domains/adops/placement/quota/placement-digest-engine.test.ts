import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementDigestEngine } from "./placement-digest-engine.js";
import { newPlacementDigest } from "./placement-digest.js";

test("PlacementDigestEngine keeps results within bounds", () => {
  const engine = defaultPlacementDigestEngine(flags.newRegistry());
  const item = newPlacementDigest("code-583", "name-220");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
