import * as text from "../../../../kit/text.js";

/** Where a default pacing agreement is in its life cycle. */
export type DefaultPacingAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One default pacing agreement, with what the planners need to act on it. */
export class DefaultPacingAgreement {
  code: string;
  label: string;
  source: string;
  threshold: number;
  frequencyCap: number;
  floorValue: number;
  limit: number;
  sendAt: number;
  status: DefaultPacingAgreementStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    threshold: number,
    frequencyCap: number,
    floorValue: number,
    limit: number,
    sendAt: number,
    status: DefaultPacingAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.threshold = threshold;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.limit = limit;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultPacingAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPacingAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default pacing agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.limit + this.floorValue) * 100) / 100;
  }

  copy(): DefaultPacingAgreement {
    return new DefaultPacingAgreement(
      this.code,
      this.label,
      this.source,
      this.threshold,
      this.frequencyCap,
      this.floorValue,
      this.limit,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a default pacing agreement in status idle. */
export function newDefaultPacingAgreement(code: string, label: string): DefaultPacingAgreement {
  return new DefaultPacingAgreement(code, label, "", 0, 0, 0, 0, 0, "idle");
}
