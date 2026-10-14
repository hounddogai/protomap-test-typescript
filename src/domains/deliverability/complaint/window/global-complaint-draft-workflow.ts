import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalComplaintDraftEngine, defaultGlobalComplaintDraftEngine } from "./global-complaint-draft-engine.js";
import {
  GlobalComplaintDraftValidator,
  defaultGlobalComplaintDraftValidator,
} from "./global-complaint-draft-rules.js";
import { GlobalComplaintDraftStore } from "./global-complaint-draft-store.js";

/** Moves global complaint drafts through their life cycle and keeps a journal of what it did. */
export class GlobalComplaintDraftDesk {
  store: GlobalComplaintDraftStore;
  validator: GlobalComplaintDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalComplaintDraftEngine;

  constructor(
    store: GlobalComplaintDraftStore,
    validator: GlobalComplaintDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalComplaintDraftEngine,
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
      throw new Error(`global complaint draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global complaint draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global complaint draft ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalComplaintDraftDesk(store: GlobalComplaintDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalComplaintDraftDesk {
  return new GlobalComplaintDraftDesk(
    store,
    defaultGlobalComplaintDraftValidator(),
    clockValue,
    [],
    defaultGlobalComplaintDraftEngine(flagsValue),
  );
}
