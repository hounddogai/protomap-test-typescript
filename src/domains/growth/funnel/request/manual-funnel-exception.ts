import * as text from "../../../../kit/text.js";

/** Where a manual funnel exception is in its life cycle. */
export type ManualFunnelExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One manual funnel exception, with what the planners need to act on it. */
export class ManualFunnelException {
  code: string;
  label: string;
  ratio: number;
  campaignRef: string;
  attempts: number;
  margin: number;
  visible: boolean;
  status: ManualFunnelExceptionStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    campaignRef: string,
    attempts: number,
    margin: number,
    visible: boolean,
    status: ManualFunnelExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.campaignRef = campaignRef;
    this.attempts = attempts;
    this.margin = margin;
    this.visible = visible;
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

  canMoveTo(next: ManualFunnelExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualFunnelExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual funnel exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual funnel exception"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.attempts + this.margin) * 100) / 100;
  }

  copy(): ManualFunnelException {
    return new ManualFunnelException(
      this.code,
      this.label,
      this.ratio,
      this.campaignRef,
      this.attempts,
      this.margin,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual funnel exception in status idle. */
export function newManualFunnelException(code: string, label: string): ManualFunnelException {
  return new ManualFunnelException(code, label, 0, "", 0, 0, false, "idle");
}
