/**
 * Command adopsctl runs adops's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import { buildCreativeManifestReport } from "../../domains/adops/creative/exception/creative-manifest-report.js";
import { newMemoryCreativeManifestStore } from "../../domains/adops/creative/exception/creative-manifest-store.js";
import { newCreativeManifestService } from "../../domains/adops/creative/exception/creative-manifest-workflow.js";
import { newCreativeManifest } from "../../domains/adops/creative/exception/creative-manifest.js";
import { buildPacingRollupReport } from "../../domains/adops/pacing/rollup/pacing-rollup-report.js";
import { newMemoryPacingRollupStore } from "../../domains/adops/pacing/rollup/pacing-rollup-store.js";
import { newPacingRollupCoordinator } from "../../domains/adops/pacing/rollup/pacing-rollup-workflow.js";
import { newPacingRollup } from "../../domains/adops/pacing/rollup/pacing-rollup.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["creative-manifest", (): boolean => {
      const store = newMemoryCreativeManifestStore();
      for (let index = 0; index < 11; index++) {
        store.save(newCreativeManifest(`creative-manifest-${index}`, `Sample creative manifest ${index}`));
      }
      const flow = newCreativeManifestService(store, clockValue);
      try {
        flow.submit("creative-manifest-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildCreativeManifestReport("Creative Manifest", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["pacing-rollup", (): boolean => {
      const store = newMemoryPacingRollupStore();
      for (let index = 0; index < 4; index++) {
        store.save(newPacingRollup(`pacing-rollup-${index}`, `Sample pacing rollup ${index}`));
      }
      const flow = newPacingRollupCoordinator(store, clockValue);
      try {
        flow.open("pacing-rollup-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildPacingRollupReport("Pacing Rollup", items, clockValue);
      console.log(report.render());
      return flow.sweep(Math.floor(Date.now() / 1000)) >= 0;
    }],
  ]);
  let failed = 0;
  for (const name of [...commands.keys()].sort()) {
    const command = commands.get(name)!;
    if (!command()) {
      console.log(`${name} failed`);
      failed += 1;
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
}

main();
