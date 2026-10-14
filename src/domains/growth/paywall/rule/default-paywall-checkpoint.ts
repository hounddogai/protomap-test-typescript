import * as text from "../../../../kit/text.js";

/** Where a default paywall checkpoint is in its life cycle. */
export type DefaultPaywallCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default paywall checkpoint. Its code is unique within a tenant. */
export class DefaultPaywallCheckpoint {
  code: string;
  name: string;
  locale: string;
  priority: number;
  unit: string;
  impressions: number;
  threshold: number;
  status: DefaultPaywallCheckpointStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    priority: number,
    unit: string,
    impressions: number,
    threshold: number,
    status: DefaultPaywallCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.priority = priority;
    this.unit = unit;
    this.impressions = impressions;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultPaywallCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPaywallCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default paywall checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.priority - this.threshold) * 100) / 100;
  }

  copy(): DefaultPaywallCheckpoint {
    return new DefaultPaywallCheckpoint(
      this.code,
      this.name,
      this.locale,
      this.priority,
      this.unit,
      this.impressions,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default paywall checkpoint in status open. */
export function newDefaultPaywallCheckpoint(code: string, name: string): DefaultPaywallCheckpoint {
  return new DefaultPaywallCheckpoint(code, name, "", 0, "", 0, 0, "open");
}
