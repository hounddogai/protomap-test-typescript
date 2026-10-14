import * as text from "../../../../kit/text.js";

/** Where a macro preference is in its life cycle. */
export type MacroPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A macro preference as the macro team keeps it. */
export class MacroPreference {
  code: string;
  label: string;
  bid: number;
  visible: boolean;
  minimum: number;
  name: string;
  approved: boolean;
  active: boolean;
  status: MacroPreferenceStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    visible: boolean,
    minimum: number,
    name: string,
    approved: boolean,
    active: boolean,
    status: MacroPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.visible = visible;
    this.minimum = minimum;
    this.name = name;
    this.approved = approved;
    this.active = active;
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

  canMoveTo(next: MacroPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"macro preference"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.bid * this.minimum * 100) / 100;
  }

  copy(): MacroPreference {
    return new MacroPreference(
      this.code,
      this.label,
      this.bid,
      this.visible,
      this.minimum,
      this.name,
      this.approved,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro preference in status requested. */
export function newMacroPreference(code: string, label: string): MacroPreference {
  return new MacroPreference(code, label, 0, false, 0, "", false, false, "requested");
}
