import * as clock from "../../../../kit/clock.js";
import { MacroRecordValidator, defaultMacroRecordValidator } from "./macro-record-rules.js";
import { MacroRecordStore } from "./macro-record-store.js";

/** Moves macro records through their life cycle and keeps a journal of what it did. */
export class MacroRecordService {
  store: MacroRecordStore;
  validator: MacroRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: MacroRecordStore,
    validator: MacroRecordValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro record ${code} not found`);
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
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newMacroRecordService(store: MacroRecordStore, clockValue: clock.Clock): MacroRecordService {
  return new MacroRecordService(store, defaultMacroRecordValidator(), clockValue, []);
}
