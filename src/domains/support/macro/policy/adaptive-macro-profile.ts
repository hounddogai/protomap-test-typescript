import * as text from "../../../../kit/text.js";

/** Where a adaptive macro profile is in its life cycle. */
export type AdaptiveMacroProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive macro profile as the macro team keeps it. */
export class AdaptiveMacroProfile {
  code: string;
  title: string;
  conversionRate: number;
  graceDays: number;
  visible: boolean;
  revision: number;
  retries: number;
  attempts: number;
  status: AdaptiveMacroProfileStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    graceDays: number,
    visible: boolean,
    revision: number,
    retries: number,
    attempts: number,
    status: AdaptiveMacroProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.visible = visible;
    this.revision = revision;
    this.retries = retries;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveMacroProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveMacroProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive macro profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round((this.conversionRate + this.graceDays) * 100) / 100;
  }

  copy(): AdaptiveMacroProfile {
    return new AdaptiveMacroProfile(
      this.code,
      this.title,
      this.conversionRate,
      this.graceDays,
      this.visible,
      this.revision,
      this.retries,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive macro profile in status proposed. */
export function newAdaptiveMacroProfile(code: string, title: string): AdaptiveMacroProfile {
  return new AdaptiveMacroProfile(code, title, 0, 0, false, 0, 0, 0, "proposed");
}
