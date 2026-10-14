import * as clock from "../../../../kit/clock.js";
import { PrimaryCsatManifestValidator, defaultPrimaryCsatManifestValidator } from "./primary-csat-manifest-rules.js";
import { PrimaryCsatManifestStore } from "./primary-csat-manifest-store.js";

/** Moves primary csat manifests through their life cycle and keeps a journal of what it did. */
export class PrimaryCsatManifestWorkflow {
  store: PrimaryCsatManifestStore;
  validator: PrimaryCsatManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryCsatManifestStore,
    validator: PrimaryCsatManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary csat manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary csat manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryCsatManifestWorkflow(store: PrimaryCsatManifestStore, clockValue: clock.Clock): PrimaryCsatManifestWorkflow {
  return new PrimaryCsatManifestWorkflow(store, defaultPrimaryCsatManifestValidator(), clockValue, []);
}
