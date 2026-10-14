import * as text from "../../../../kit/text.js";

/** Where a macro group is in its life cycle. */
export type MacroGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** One macro group, with what the planners need to act on it. */
export class MacroGroup {
  code: string;
  name: string;
  active: boolean;
  frequencyCap: number;
  description: string;
  status: MacroGroupStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    frequencyCap: number,
    description: string,
    status: MacroGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MacroGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"macro group"} ${this.code}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): MacroGroup {
    return new MacroGroup(this.code, this.name, this.active, this.frequencyCap, this.description, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a macro group in status requested. */
export function newMacroGroup(code: string, name: string): MacroGroup {
  return new MacroGroup(code, name, false, 0, "", "requested");
}
