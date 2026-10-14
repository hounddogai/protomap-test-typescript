import * as text from "../../../../kit/text.js";

/** Where a legacy creative window is in its life cycle. */
export type LegacyCreativeWindowStatus = "created" | "validated" | "published" | "retired";

/** A legacy creative window as the creative team keeps it. */
export class LegacyCreativeWindow {
  code: string;
  name: string;
  visible: boolean;
  frequencyCap: number;
  windowDays: number;
  pinned: boolean;
  batchSize: number;
  label: string;
  country: string;
  status: LegacyCreativeWindowStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    frequencyCap: number,
    windowDays: number,
    pinned: boolean,
    batchSize: number,
    label: string,
    country: string,
    status: LegacyCreativeWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.pinned = pinned;
    this.batchSize = batchSize;
    this.label = label;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyCreativeWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCreativeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy creative window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.batchSize - this.windowDays) * 100) / 100;
  }

  copy(): LegacyCreativeWindow {
    return new LegacyCreativeWindow(
      this.code,
      this.name,
      this.visible,
      this.frequencyCap,
      this.windowDays,
      this.pinned,
      this.batchSize,
      this.label,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy creative window in status created. */
export function newLegacyCreativeWindow(code: string, name: string): LegacyCreativeWindow {
  return new LegacyCreativeWindow(code, name, false, 0, 0, false, 0, "", "", "created");
}
