import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalStreakSnapshotEngine } from "./regional-streak-snapshot-engine.js";
import { newRegionalStreakSnapshot } from "./regional-streak-snapshot.js";

test("RegionalStreakSnapshotEngine keeps results within bounds", () => {
  const engine = defaultRegionalStreakSnapshotEngine();
  const item = newRegionalStreakSnapshot("code-912", "title-183");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
