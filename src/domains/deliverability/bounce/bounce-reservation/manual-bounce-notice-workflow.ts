import * as clock from "../../../../kit/clock.js";
import { ManualBounceNoticeEngine, defaultManualBounceNoticeEngine } from "./manual-bounce-notice-engine.js";
import { ManualBounceNoticeValidator, defaultManualBounceNoticeValidator } from "./manual-bounce-notice-rules.js";
import { ManualBounceNoticeStore } from "./manual-bounce-notice-store.js";

/** Moves manual bounce notices through their life cycle and keeps a journal of what it did. */
export class ManualBounceNoticeDesk {
  store: ManualBounceNoticeStore;
  validator: ManualBounceNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualBounceNoticeEngine;

  constructor(
    store: ManualBounceNoticeStore,
    validator: ManualBounceNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualBounceNoticeEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual bounce notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual bounce notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual bounce notice ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newManualBounceNoticeDesk(store: ManualBounceNoticeStore, clockValue: clock.Clock): ManualBounceNoticeDesk {
  return new ManualBounceNoticeDesk(
    store,
    defaultManualBounceNoticeValidator(),
    clockValue,
    [],
    defaultManualBounceNoticeEngine(),
  );
}
