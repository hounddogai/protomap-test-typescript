import * as clock from "../../../../kit/clock.js";
import { LegacyMacroProposalValidator, defaultLegacyMacroProposalValidator } from "./legacy-macro-proposal-rules.js";
import { LegacyMacroProposalStore } from "./legacy-macro-proposal-store.js";

/** Moves legacy macro proposals through their life cycle and keeps a journal of what it did. */
export class LegacyMacroProposalManager {
  store: LegacyMacroProposalStore;
  validator: LegacyMacroProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyMacroProposalStore,
    validator: LegacyMacroProposalValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy macro proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy macro proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newLegacyMacroProposalManager(store: LegacyMacroProposalStore, clockValue: clock.Clock): LegacyMacroProposalManager {
  return new LegacyMacroProposalManager(store, defaultLegacyMacroProposalValidator(), clockValue, []);
}
