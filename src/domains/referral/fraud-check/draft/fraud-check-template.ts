import * as text from "../../../../kit/text.js";

/** Where a fraud check template is in its life cycle. */
export type FraudCheckTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fraud check template as the fraud check team keeps it. */
export class FraudCheckTemplate {
  code: string;
  label: string;
  floorValue: number;
  sendAt: number;
  startsAt: number;
  sequence: number;
  status: FraudCheckTemplateStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    sendAt: number,
    startsAt: number,
    sequence: number,
    status: FraudCheckTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
    this.startsAt = startsAt;
    this.sequence = sequence;
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

  canMoveTo(next: FraudCheckTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FraudCheckTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.floorValue - this.sendAt) * 100) / 100;
  }

  copy(): FraudCheckTemplate {
    return new FraudCheckTemplate(
      this.code,
      this.label,
      this.floorValue,
      this.sendAt,
      this.startsAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check template in status idle. */
export function newFraudCheckTemplate(code: string, label: string): FraudCheckTemplate {
  return new FraudCheckTemplate(code, label, 0, 0, 0, 0, "idle");
}
