import * as clock from "../../../../kit/clock.js";
import { GlobalProofDigestValidator, defaultGlobalProofDigestValidator } from "./global-proof-digest-rules.js";
import { GlobalProofDigestStore } from "./global-proof-digest-store.js";

/** Moves global proof digests through their life cycle and keeps a journal of what it did. */
export class GlobalProofDigestManager {
  store: GlobalProofDigestStore;
  validator: GlobalProofDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalProofDigestStore,
    validator: GlobalProofDigestValidator,
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
      throw new Error(`global proof digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global proof digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalProofDigestManager(store: GlobalProofDigestStore, clockValue: clock.Clock): GlobalProofDigestManager {
  return new GlobalProofDigestManager(store, defaultGlobalProofDigestValidator(), clockValue, []);
}
