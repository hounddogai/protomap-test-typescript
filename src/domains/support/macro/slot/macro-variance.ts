import * as text from "../../../../kit/text.js";

/** Where a macro variance is in its life cycle. */
export type MacroVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a macro variance and its current status. */
export class MacroVariance {
  code: string;
  label: string;
  variant: string;
  sequence: number;
  channel: string;
  visible: boolean;
  campaignRef: string;
  segment: string;
  source: string;
  threshold: number;
  status: MacroVarianceStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    sequence: number,
    channel: string,
    visible: boolean,
    campaignRef: string,
    segment: string,
    source: string,
    threshold: number,
    status: MacroVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.sequence = sequence;
    this.channel = channel;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.source = source;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"macro variance"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.threshold + this.sequence) * 100) / 100;
  }

  copy(): MacroVariance {
    return new MacroVariance(
      this.code,
      this.label,
      this.variant,
      this.sequence,
      this.channel,
      this.visible,
      this.campaignRef,
      this.segment,
      this.source,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a macro variance in status new. */
export function newMacroVariance(code: string, label: string): MacroVariance {
  return new MacroVariance(code, label, "", 0, "", false, "", "", "", 0, "new");
}
