import * as clock from "../../../../kit/clock.js";
import {
  TieredProofAgreementValidator,
  defaultTieredProofAgreementValidator,
} from "./tiered-proof-agreement-rules.js";
import { TieredProofAgreementStore } from "./tiered-proof-agreement-store.js";

/** Moves tiered proof agreements through their life cycle and keeps a journal of what it did. */
export class TieredProofAgreementCoordinator {
  store: TieredProofAgreementStore;
  validator: TieredProofAgreementValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredProofAgreementStore,
    validator: TieredProofAgreementValidator,
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
      throw new Error(`tiered proof agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered proof agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newTieredProofAgreementCoordinator(store: TieredProofAgreementStore, clockValue: clock.Clock): TieredProofAgreementCoordinator {
  return new TieredProofAgreementCoordinator(store, defaultTieredProofAgreementValidator(), clockValue, []);
}
