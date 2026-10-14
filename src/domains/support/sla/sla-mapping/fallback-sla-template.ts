import * as text from "../../../../kit/text.js";

/** Where a fallback sla template is in its life cycle. */
export type FallbackSlaTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback sla template, with what the planners need to act on it. */
export class FallbackSlaTemplate {
  code: string;
  label: string;
  visible: boolean;
  startsAt: number;
  impressions: number;
  status: FallbackSlaTemplateStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    startsAt: number,
    impressions: number,
    status: FallbackSlaTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.startsAt = startsAt;
    this.impressions = impressions;
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

  canMoveTo(next: FallbackSlaTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackSlaTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sla template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedVolume(): number {
    return Math.round(this.impressions * this.startsAt * 100) / 100;
  }

  copy(): FallbackSlaTemplate {
    return new FallbackSlaTemplate(this.code, this.label, this.visible, this.startsAt, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback sla template in status idle. */
export function newFallbackSlaTemplate(code: string, label: string): FallbackSlaTemplate {
  return new FallbackSlaTemplate(code, label, false, 0, 0, "idle");
}
