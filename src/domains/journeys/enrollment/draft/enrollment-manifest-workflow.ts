import * as clock from "../../../../kit/clock.js";
import { EnrollmentManifestValidator, defaultEnrollmentManifestValidator } from "./enrollment-manifest-rules.js";
import { EnrollmentManifestStore } from "./enrollment-manifest-store.js";

/** Moves enrollment manifests through their life cycle and keeps a journal of what it did. */
export class EnrollmentManifestDesk {
  store: EnrollmentManifestStore;
  validator: EnrollmentManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: EnrollmentManifestStore,
    validator: EnrollmentManifestValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newEnrollmentManifestDesk(store: EnrollmentManifestStore, clockValue: clock.Clock): EnrollmentManifestDesk {
  return new EnrollmentManifestDesk(store, defaultEnrollmentManifestValidator(), clockValue, []);
}
